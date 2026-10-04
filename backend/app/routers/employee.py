from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/employee", tags=["employee"],
    dependencies=[Depends(auth.require_role("employee", "manager", "admin"))],
)


def _total_hours_for_day(db: Session, user_id: int, work_date, exclude_entry_id=None):
    """Sums all of a user's hours on a given date, so we can enforce the 12hr/day limit
    across MULTIPLE entries (the database itself can't check across rows)."""
    query = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.user_id == user_id,
        models.TimesheetEntry.work_date == work_date,
    )
    if exclude_entry_id:
        query = query.filter(models.TimesheetEntry.id != exclude_entry_id)
    return sum(float(e.hours) for e in query.all())


@router.get("/projects", response_model=List[schemas.ProjectOut])
def my_projects(db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    """Returns only the projects this employee has been assigned to by an admin."""
    project_ids = [
        a.project_id for a in db.query(models.ProjectAssignment).filter(
            models.ProjectAssignment.user_id == current_user.id
        ).all()
    ]
    return db.query(models.Project).filter(
        models.Project.id.in_(project_ids), models.Project.is_active == True
    ).all()


@router.post("/timesheets", response_model=schemas.TimesheetOut)
def create_entry(payload: schemas.TimesheetCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    if payload.hours < 0.5 or payload.hours > 12:
        raise HTTPException(status_code=400, detail="Hours must be between 0.5 and 12")

    already_logged = _total_hours_for_day(db, current_user.id, payload.work_date)
    if already_logged + payload.hours > 12:
        raise HTTPException(status_code=400, detail="Total hours for this day would exceed 12")

    entry = models.TimesheetEntry(
        user_id=current_user.id,
        project_id=payload.project_id,
        work_date=payload.work_date,
        hours=payload.hours,
        description=payload.description,
        status="draft",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/timesheets", response_model=List[schemas.TimesheetOut])
def my_entries(db: Session = Depends(get_db),
                current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.user_id == current_user.id
    ).order_by(models.TimesheetEntry.work_date.desc()).all()


@router.put("/timesheets/{entry_id}", response_model=schemas.TimesheetOut)
def update_entry(entry_id: int, payload: schemas.TimesheetUpdate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    entry = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.id == entry_id, models.TimesheetEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Only draft or rejected entries can be edited")

    data = payload.dict(exclude_unset=True)
    new_hours = data.get("hours", float(entry.hours))
    new_date = data.get("work_date", entry.work_date)

    if new_hours < 0.5 or new_hours > 12:
        raise HTTPException(status_code=400, detail="Hours must be between 0.5 and 12")

    already_logged = _total_hours_for_day(db, current_user.id, new_date, exclude_entry_id=entry.id)
    if already_logged + new_hours > 12:
        raise HTTPException(status_code=400, detail="Total hours for this day would exceed 12")

    for field, value in data.items():
        setattr(entry, field, value)

    # editing a rejected entry and resubmitting happens via the /submit endpoint
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/timesheets/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    entry = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.id == entry_id, models.TimesheetEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft entries can be deleted")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}


@router.post("/timesheets/{entry_id}/submit", response_model=schemas.TimesheetOut)
def submit_entry(entry_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    entry = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.id == entry_id, models.TimesheetEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Only draft or rejected entries can be submitted")

    entry.status = "submitted"
    entry.reject_comment = None
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/dashboard")
def employee_dashboard(db: Session = Depends(get_db),
                        current_user: models.User = Depends(auth.get_current_user)):
    base = db.query(models.TimesheetEntry).filter(models.TimesheetEntry.user_id == current_user.id)

    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)              # Sunday
    week_entries = base.filter(
        models.TimesheetEntry.work_date >= week_start,
        models.TimesheetEntry.work_date <= week_end,
    ).all()
    hours_this_week = sum(float(e.hours) for e in week_entries)

    return {
        "draft": base.filter(models.TimesheetEntry.status == "draft").count(),
        "submitted": base.filter(models.TimesheetEntry.status == "submitted").count(),
        "approved": base.filter(models.TimesheetEntry.status == "approved").count(),
        "rejected": base.filter(models.TimesheetEntry.status == "rejected").count(),
        "hours_this_week": hours_this_week,
    }
