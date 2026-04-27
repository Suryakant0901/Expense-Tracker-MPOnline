from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth
from datetime import date

app = FastAPI(title="Modern Expense Tracker API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and create admin
models.Base.metadata.create_all(bind=database.engine)

def init_db():
    db = next(database.get_db())
    admin_email = "chaturvedisuryakant2005@gmail.com"
    admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin:
        admin = models.User(
            name="Suryakant Chaturvedi",
            email=admin_email,
            password="admin123",
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Admin user created: {admin_email}")
    
    # Create viewer user
    viewer_email = "viewer@example.com"
    viewer = db.query(models.User).filter(models.User.email == viewer_email).first()
    if not viewer:
        viewer = models.User(
            name="Viewer",
            email=viewer_email,
            password="viewer123",
            role="viewer"
        )
        db.add(viewer)
        db.commit()
        db.refresh(viewer)
        print(f"Viewer user created: {viewer_email}")

    # Check if admin has any transactions, if not, add default ones
    tx_count = db.query(models.Transaction).filter(models.Transaction.user_id == admin.id).count()
    if tx_count == 0:
        default_txs = [
            {"id": "tx-1", "description": "Monthly Salary", "category": "Salary", "type": "income", "amount": 95000, "date": date(2026, 4, 1), "notes": "Main source"},
            {"id": "tx-2", "description": "Freelance Project", "category": "Freelance", "type": "income", "amount": 15000, "date": date(2026, 4, 5), "notes": "Web design"},
            {"id": "tx-3", "description": "House Rent", "category": "Housing", "type": "expense", "amount": 25000, "date": date(2026, 4, 2), "notes": "April rent"},
            {"id": "tx-4", "description": "Groceries", "category": "Food", "type": "expense", "amount": 5400, "date": date(2026, 4, 3), "notes": "Weekly stock"},
            {"id": "tx-5", "description": "Electricity Bill", "category": "Utilities", "type": "expense", "amount": 2100, "date": date(2026, 4, 7), "notes": "Monthly"},
            {"id": "tx-6", "description": "New Desk Setup", "category": "Shopping", "type": "expense", "amount": 12000, "date": date(2026, 4, 10), "notes": "Ergonomic chair"},
            {"id": "tx-7", "description": "Mutual Fund SIP", "category": "Investments", "type": "expense", "amount": 10000, "date": date(2026, 4, 12), "notes": "Monthly SIP"},
            {"id": "tx-8", "description": "Dinner with Friends", "category": "Food", "type": "expense", "amount": 3200, "date": date(2026, 4, 15), "notes": "Weekend"},
            {"id": "tx-9", "description": "Gas Refill", "category": "Transport", "type": "expense", "amount": 4500, "date": date(2026, 4, 16), "notes": "Car tank"},
            {"id": "tx-10", "description": "Netflix Subscription", "category": "Entertainment", "type": "expense", "amount": 799, "date": date(2026, 4, 18), "notes": "Premium plan"},
        ]

        for tx in default_txs:
            db_tx = models.Transaction(**tx, user_id=admin.id)
            db.add(db_tx)
        
        db.commit()
        print("10 Default transactions added for Admin.")

    # Check if viewer has any transactions, if not, add default ones
    viewer_tx_count = db.query(models.Transaction).filter(models.Transaction.user_id == viewer.id).count()
    if viewer_tx_count == 0:
        viewer_txs = [
            {"id": "vtx-1", "description": "Monthly Salary", "category": "Salary", "type": "income", "amount": 50000, "date": date(2026, 4, 1), "notes": "Main income"},
            {"id": "vtx-2", "description": "Bonus", "category": "Freelance", "type": "income", "amount": 8000, "date": date(2026, 4, 5), "notes": "Performance bonus"},
            {"id": "vtx-3", "description": "Apartment Rent", "category": "Housing", "type": "expense", "amount": 15000, "date": date(2026, 4, 2), "notes": "Monthly rent"},
            {"id": "vtx-4", "description": "Groceries & Food", "category": "Food", "type": "expense", "amount": 4200, "date": date(2026, 4, 3), "notes": "Supermarket"},
            {"id": "vtx-5", "description": "Internet Bill", "category": "Utilities", "type": "expense", "amount": 1500, "date": date(2026, 4, 7), "notes": "Monthly"},
            {"id": "vtx-6", "description": "Coffee & Snacks", "category": "Food", "type": "expense", "amount": 1800, "date": date(2026, 4, 10), "notes": "Cafe"},
            {"id": "vtx-7", "description": "Online Course", "category": "Investments", "type": "expense", "amount": 2500, "date": date(2026, 4, 12), "notes": "Python certification"},
            {"id": "vtx-8", "description": "Movie Ticket", "category": "Entertainment", "type": "expense", "amount": 500, "date": date(2026, 4, 15), "notes": "Cinema"},
            {"id": "vtx-9", "description": "Petrol", "category": "Transport", "type": "expense", "amount": 3000, "date": date(2026, 4, 16), "notes": "Fuel"},
            {"id": "vtx-10", "description": "Gym Membership", "category": "Health", "type": "expense", "amount": 2000, "date": date(2026, 4, 18), "notes": "Monthly fees"},
        ]

        for tx in viewer_txs:
            db_tx = models.Transaction(**tx, user_id=viewer.id)
            db.add(db_tx)
        
        db.commit()
        print("10 Default transactions added for Viewer.")

init_db()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Expense Tracker API is running"}

# Auth Endpoints
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real app, hash the password
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=user.password,
        role="user",
        is_blocked=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        models.User.email == credentials.email,
        models.User.password == credentials.password
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is blocked
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Your ID is blocked")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }

# Transaction Endpoints
@app.get("/transactions", response_model=List[schemas.Transaction])
def get_transactions(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()

@app.post("/transactions", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, user_id: int, db: Session = Depends(database.get_db)):
    # Check if user is viewer - viewers cannot create transactions
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create transactions")
    
    db_transaction = models.Transaction(**transaction.model_dump(), user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.put("/transactions/{tx_id}", response_model=schemas.Transaction)
def update_transaction(tx_id: str, transaction: schemas.TransactionUpdate, user_id: int, db: Session = Depends(database.get_db)):
    # Check if user is viewer - viewers cannot update transactions
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot update transactions")
    
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    for key, value in transaction.model_dump(exclude_unset=True).items():
        setattr(db_tx, key, value)
    
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: str, user_id: int, db: Session = Depends(database.get_db)):
    # Check if user is viewer - viewers cannot delete transactions
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot delete transactions")
    
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_tx)
    db.commit()
    return {"message": "Transaction deleted"}

# Admin Endpoints
@app.get("/admin/users/count")
def get_users_count(db: Session = Depends(database.get_db)):
    count = db.query(models.User).filter(models.User.role != "viewer").count()
    return {"total_users": count}

@app.get("/admin/users", response_model=List[schemas.User])
def get_all_users(user_id: int, db: Session = Depends(database.get_db)):
    # Check if user is admin
    admin_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    
    return db.query(models.User).filter(models.User.role != "viewer").all()

@app.put("/admin/users/{target_user_id}/block")
def block_user(target_user_id: int, admin_id: int, db: Session = Depends(database.get_db)):
    # Check if user is admin
    admin_user = db.query(models.User).filter(models.User.id == admin_id).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle blocked status
    target_user.is_blocked = 1 - target_user.is_blocked
    db.commit()
    db.refresh(target_user)
    
    status = "blocked" if target_user.is_blocked else "unblocked"
    return {"message": f"User {status} successfully", "is_blocked": target_user.is_blocked}

@app.delete("/admin/users/{target_user_id}")
def delete_user(target_user_id: int, admin_id: int, db: Session = Depends(database.get_db)):
    # Check if user is admin
    admin_user = db.query(models.User).filter(models.User.id == admin_id).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user's transactions first
    db.query(models.Transaction).filter(models.Transaction.user_id == target_user_id).delete()
    
    # Delete user
    db.delete(target_user)
    db.commit()
    
    return {"message": "User deleted successfully"}
