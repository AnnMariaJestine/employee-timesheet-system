from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ---- Auth ----
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: int


# ---- Department ----
class DepartmentCreate(BaseModel):
    name: str
    code: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    is_active: bool
    class Config:
        from_attributes = True


# ---- User ----
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # admin / employee / manager
    department_id: Optional[int] = None
    manager_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int]
    manager_id: Optional[int]
    is_active: bool
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None


class PasswordResetRequest(BaseModel):
    new_password: str


# ---- Project ----
class ProjectCreate(BaseModel):
    code: str
    name: str
    client_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectOut(BaseModel):
    id: int
    code: str
    name: str
    client_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    class Config:
        from_attributes = True


# ---- Project Assignment ----
class AssignmentCreate(BaseModel):
    user_id: int
    project_id: int


class AssignmentOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    user_name: str
    project_code: str
    class Config:
        from_attributes = True


# ---- Timesheet ----
class TimesheetCreate(BaseModel):
    project_id: int
    work_date: date
    hours: float
    description: Optional[str] = None


class TimesheetUpdate(BaseModel):
    project_id: Optional[int] = None
    work_date: Optional[date] = None
    hours: Optional[float] = None
    description: Optional[str] = None


class TimesheetOut(BaseModel):
    id: int
    user_id: int
    project_id: int
    work_date: date
    hours: float
    description: Optional[str] = None
    status: str
    reject_comment: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


class RejectRequest(BaseModel):
    comment: str
