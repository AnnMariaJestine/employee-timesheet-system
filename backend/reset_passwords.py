from app.database import SessionLocal
from app import models
from app.auth import hash_password

db = SessionLocal()

manager = db.query(models.User).filter(models.User.email == "manager@test.com").first()
employee = db.query(models.User).filter(models.User.email == "employee@test.com").first()

if manager:
    manager.hashed_password = hash_password("Manager@123")
    print("Manager password reset.")
else:
    print("Manager not found!")

if employee:
    employee.hashed_password = hash_password("Employee@123")
    print("Employee password reset.")
else:
    print("Employee not found!")

db.commit()
db.close()