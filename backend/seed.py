"""
Run this once after the database schema exists, to create test accounts
for all 3 roles, plus a couple of sample projects.

Run with:  python seed.py
"""
from app.database import SessionLocal
from app import models
from app.auth import hash_password

db = SessionLocal()

try:
    # ---- Department ----
    dept = db.query(models.Department).filter(models.Department.name == "Engineering").first()
    if not dept:
        dept = models.Department(name="Engineering")
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # ---- Admin ----
    admin = db.query(models.User).filter(models.User.email == "admin@123.com").first()
    if not admin:
        admin = models.User(
            name="Admin User", email="admin@123.com",
            password_hash=hash_password("Admin@123"),
            role="admin", department_id=dept.id,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # ---- Manager ----
    manager = db.query(models.User).filter(models.User.email == "manager@test.com").first()
    if not manager:
        manager = models.User(
            name="Manager User", email="manager@test.com",
            password_hash=hash_password("Manager@123"),
            role="manager", department_id=dept.id,
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)

    # ---- Employee (reports to the manager above) ----
    employee = db.query(models.User).filter(models.User.email == "employee@test.com").first()
    if not employee:
        employee = models.User(
            name="Employee User", email="employee@test.com",
            password_hash=hash_password("Employee@123"),
            role="employee", department_id=dept.id, manager_id=manager.id,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    # ---- Sample projects ----
    for code, name in [("PRJ-001", "Timesheet App"), ("PRJ-002", "Internal Tools")]:
        if not db.query(models.Project).filter(models.Project.code == code).first():
            db.add(models.Project(code=code, name=name))
    db.commit()

    # ---- Assign employee to a project ----
    project = db.query(models.Project).filter(models.Project.code == "PRJ-001").first()
    exists = db.query(models.ProjectAssignment).filter(
        models.ProjectAssignment.user_id == employee.id,
        models.ProjectAssignment.project_id == project.id,
    ).first()
    if not exists:
        db.add(models.ProjectAssignment(user_id=employee.id, project_id=project.id))
        db.commit()

    print("Seed complete. Test logins:")
    print("  Admin:    admin@123.com        / Admin@123")
    print("  Manager:  manager@test.com  / Manager@123")
    print("  Employee: employee@test.com / Employee@123")

finally:
    db.close()
