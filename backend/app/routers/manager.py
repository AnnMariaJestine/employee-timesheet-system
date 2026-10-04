from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/manager", tags=["manager"],
    dependencies=[Depends(auth.require_role("manager", "admin"))],
)


@router.get("/timesheets", response_model=List[schemas.TimesheetOut])
def team_entries(
    status: Optional[str] = None,
    employee_id: Optional[int] = None,
    project_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Shows entries only from users who report to this manager (manager_id = current_user.id).
    Supports filtering by status, a specific direct report, a project, and a date range."""
    direct_report_ids = [
        u.id for u in db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    ]
    query = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.user_id.in_(direct_report_ids)
    )
    if status:
        query = query.filter(models.TimesheetEntry.status == status)
    if employee_id:
        if employee_id not in direct_report_ids:
            raise HTTPException(status_code=403, detail="Not your direct report")
        query = query.filter(models.TimesheetEntry.user_id == employee_id)
    if project_id:
        query = query.filter(models.TimesheetEntry.project_id == project_id)
    if date_from:
        query = query.filter(models.TimesheetEntry.work_date >= date_from)
    if date_to:
        query = query.filter(models.TimesheetEntry.work_date <= date_to)
    return query.order_by(models.TimesheetEntry.work_date.desc()).all()


@router.get("/team")
def my_team(db: Session = Depends(get_db),
            current_user: models.User = Depends(auth.get_current_user)):
    """Returns this manager's direct reports, so the frontend can build an employee filter dropdown."""
    reports = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    return [{"id": u.id, "name": u.name} for u in reports]


@router.get("/projects", response_model=List[schemas.ProjectOut])
def manager_projects(db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    """Returns active projects, so the manager can filter their team's timesheets by project
    (managers don't have access to the admin project list)."""
    return db.query(models.Project).filter(models.Project.is_active == True).all()


def _get_team_entry(db, current_user, entry_id):
    direct_report_ids = [
        u.id for u in db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    ]
    entry = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.id == entry_id,
        models.TimesheetEntry.user_id.in_(direct_report_ids),
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found or not in your team")
    if entry.status != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted entries can be reviewed")
    return entry


@router.post("/timesheets/{entry_id}/approve", response_model=schemas.TimesheetOut)
def approve_entry(entry_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    entry = _get_team_entry(db, current_user, entry_id)
    entry.status = "approved"
    entry.reject_comment = None
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/timesheets/{entry_id}/reject", response_model=schemas.TimesheetOut)
def reject_entry(entry_id: int, payload: schemas.RejectRequest, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    if not payload.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required to reject")
    entry = _get_team_entry(db, current_user, entry_id)
    entry.status = "rejected"
    entry.reject_comment = payload.comment
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/dashboard")
def manager_dashboard(db: Session = Depends(get_db),
                       current_user: models.User = Depends(auth.get_current_user)):
    direct_report_ids = [
        u.id for u in db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    ]
    base = db.query(models.TimesheetEntry).filter(models.TimesheetEntry.user_id.in_(direct_report_ids))
    return {
        "team_size": len(direct_report_ids),
        "pending_review": base.filter(models.TimesheetEntry.status == "submitted").count(),
        "approved": base.filter(models.TimesheetEntry.status == "approved").count(),
        "rejected": base.filter(models.TimesheetEntry.status == "rejected").count(),
    }
