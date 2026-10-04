from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey, Date, Numeric,
    TIMESTAMP, CheckConstraint, UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from .database import Base


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=True, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' / 'employee' / 'manager'
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint("role IN ('admin','employee','manager')", name="role_check"),
    )

    department = relationship("Department")
    manager = relationship("User", remote_side=[id])


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    client_name = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "project_id"),)

    user = relationship("User")
    project = relationship("Project")


class TimesheetEntry(Base):
    __tablename__ = "timesheet_entries"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    work_date = Column(Date, nullable=False)
    hours = Column(Numeric(4, 2), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="draft")
    reject_comment = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("hours >= 0.5 AND hours <= 12", name="hours_check"),
        CheckConstraint(
            "status IN ('draft','submitted','approved','rejected')",
            name="status_check",
        ),
    )

    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project")
