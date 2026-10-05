from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth_router, admin, employee, manager

app = FastAPI(title="Employee Timesheet Management System")

# Allows our React frontend (running on a different address/port) to call this API.
# In production on Azure, replace "*" with your actual frontend URL for safety.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://employee-timesheet-system-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin.router)
app.include_router(employee.router)
app.include_router(manager.router)


@app.get("/")
def root():
    return {"status": "Timesheet API is running"}
