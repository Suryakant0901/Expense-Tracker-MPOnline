from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

class TransactionBase(BaseModel):
    date: date
    description: str
    category: str
    type: str
    amount: float
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    id: str

class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None

class Transaction(TransactionBase):
    id: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_blocked: int = 0
    transactions: List[Transaction] = []

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str
