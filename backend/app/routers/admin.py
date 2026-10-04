from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List
from datetime import date

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(auth.require_role("admin"))])


# ---- Departments ----
@router.post("/departments", response_model=schemas.DepartmentOut)
def create_department(payload: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    if payload.code and db.query(models.Department).filter(models.Department.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Department code already exists")
    dept = models.Department(name=payload.name, code=payload.code)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/departments", response_model=List[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()


@router.put("/departments/{department_id}", response_model=schemas.DepartmentOut)
def update_department(department_id: int, payload: schemas.DepartmentUpdate, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{department_id}/deactivate", response_model=schemas.DepartmentOut)
def deactivate_department(department_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.is_active = False
    db.commit()
    db.refresh(dept)
    return dept


# ---- Users ----
@router.post("/users", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if payload.role not in ("admin", "employee", "manager"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if payload.manager_id:
        mgr = db.query(models.User).filter(models.User.id == payload.manager_id).first()
        if not mgr or mgr.role != "manager":
            raise HTTPException(status_code=400, detail="manager_id must belong to a user with the Manager role")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        role=payload.role,
        department_id=payload.department_id,
        manager_id=payload.manager_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.dict(exclude_unset=True)
    if "manager_id" in data and data["manager_id"]:
        mgr = db.query(models.User).filter(models.User.id == data["manager_id"]).first()
        if not mgr or mgr.role != "manager":
            raise HTTPException(status_code=400, detail="manager_id must belong to a user with the Manager role")

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/reset-password")
def reset_password(user_id: int, payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")
    user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully"}


# ---- Projects ----
@router.post("/projects", response_model=schemas.ProjectOut)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    if db.query(models.Project).filter(models.Project.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Project code already exists")
    project = models.Project(
        code=payload.code,
        name=payload.name,
        client_name=payload.client_name,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/projects", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()


@router.put("/projects/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.put("/projects/{project_id}/deactivate", response_model=schemas.ProjectOut)
def deactivate_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_active = False
    db.commit()
    db.refresh(project)
    return project


# ---- Project Assignments ----
@router.post("/assignments")
def assign_project(payload: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    exists = db.query(models.ProjectAssignment).filter(
        models.ProjectAssignment.user_id == payload.user_id,
        models.ProjectAssignment.project_id == payload.project_id,
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Already assigned")

    assignment = models.ProjectAssignment(user_id=payload.user_id, project_id=payload.project_id)
    db.add(assignment)
    db.commit()
    return {"message": "Assigned successfully"}


@router.get("/assignments", response_model=List[schemas.AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    rows = db.query(models.ProjectAssignment).all()
    result = []
    for a in rows:
        result.append(schemas.AssignmentOut(
            id=a.id,
            user_id=a.user_id,
            project_id=a.project_id,
            user_name=a.user.name,
            project_code=a.project.code,
        ))
    return result


# ---- Dashboard ----
@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    hours_this_month = db.query(models.TimesheetEntry).filter(
        extract("year", models.TimesheetEntry.work_date) == today.year,
        extract("month", models.TimesheetEntry.work_date) == today.month,
    ).all()
    total_hours_month = sum(float(e.hours) for e in hours_this_month)

    return {
        "total_users": db.query(models.User).count(),
        "active_users": db.query(models.User).filter(models.User.is_active == True).count(),
        "total_projects": db.query(models.Project).count(),
        "active_projects": db.query(models.Project).filter(models.Project.is_active == True).count(),
        "total_departments": db.query(models.Department).count(),
        "total_hours_this_month": total_hours_month,
    }
