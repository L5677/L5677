import enum
from datetime import date, datetime, timedelta
from typing import Any, List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, func
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.exc import IntegrityError

from passlib.context import CryptContext


class Settings(BaseSettings):
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_NAME: str = "attendance_app"
    DB_USER: str = "attendance"
    DB_PASSWORD: str = "attendance123"

    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    SEED_DEMO_USERS: bool = True
    CORS_ALLOW_ORIGINS: str = "*"  # e.g. "http://localhost:5173,http://192.168.1.6:5173"


settings = Settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

Base = declarative_base()


class UserRole(str, enum.Enum):
    admin = "admin"
    employee = "employee"


class AttendanceStatus(str, enum.Enum):
    normal = "normal"
    late = "late"
    early = "early"
    absent = "absent"
    overtime = "overtime"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.employee.value)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    status = Column(String(20), nullable=False, default=AttendanceStatus.normal.value)
    check_in_time = Column(String(5), nullable=True)  # HH:MM
    check_out_time = Column(String(5), nullable=True)  # HH:MM

    deduct_minutes = Column(Integer, nullable=True)
    attendance_note = Column(Text, nullable=True)
    needs_fix = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class MonthSubmission(Base):
    __tablename__ = "month_submissions"
    __table_args__ = (UniqueConstraint("user_id", "year", "month", name="uq_submission"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    submitted_at = Column(DateTime, nullable=False, server_default=func.now())


class MonthEditGrant(Base):
    __tablename__ = "month_edit_grants"
    __table_args__ = (UniqueConstraint("user_id", "year", "month", name="uq_edit_grant"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    granted_at = Column(DateTime, nullable=False, server_default=func.now())


class AppNotification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    type = Column(String(20), nullable=False, default="warning")  # warning|info
    date = Column(Date, nullable=False, default=date.today)
    message = Column(Text, nullable=False)
    requires_fix = Column(Boolean, nullable=False, default=False)

    grant_year = Column(Integer, nullable=True)
    grant_month = Column(Integer, nullable=True)

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


def get_engine():
    url = (
        f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        "?charset=utf8mb4"
    )
    return create_engine(url, pool_pre_ping=True)


engine = get_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def db_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": exp}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(db_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class MeResponse(BaseModel):
    id: int
    username: str
    name: str
    role: UserRole


class NotificationResponse(BaseModel):
    id: int
    type: Literal["warning", "info"]
    date: str
    message: str
    isRead: bool
    requiresFix: bool
    grantMonthKey: Optional[str] = None


class AttendanceTodayResponse(BaseModel):
    clockStatus: Literal["none", "checkedIn", "completed"]
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None


class AttendanceMonthRecordResponse(BaseModel):
    date: str  # YYYY-MM-DD
    status: AttendanceStatus
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None
    needsFix: bool
    deductMinutes: Optional[int] = None
    attendanceNote: Optional[str] = None


class LockInfoResponse(BaseModel):
    submitted: bool
    canEdit: bool


class AttendanceMonthResponse(BaseModel):
    records: List[AttendanceMonthRecordResponse]
    lockInfo: LockInfoResponse


class AttendanceMonthSummaryResponse(BaseModel):
    monthWorkHours: float
    monthLeaveDays: int


class UpdateAttendanceRequest(BaseModel):
    status: Optional[AttendanceStatus] = None
    checkInTime: Optional[Optional[str]] = None
    checkOutTime: Optional[Optional[str]] = None
    deductMinutes: Optional[Optional[int]] = None
    attendanceNote: Optional[Optional[str]] = None


class SubmitMonthRequest(BaseModel):
    year: int
    month: int  # 1-12


class GrantMonthEditRequest(BaseModel):
    user_id: int
    year: int
    month: int  # 1-12


class ClaimPermissionRequest(BaseModel):
    notification_id: int


app = FastAPI(title="Attendance App API (FastAPI + MySQL)")

allow_origins = [x.strip() for x in settings.CORS_ALLOW_ORIGINS.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_origins == ["*"] else allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # 创建表 + seed 演示账号
    Base.metadata.create_all(bind=engine)
    if not settings.SEED_DEMO_USERS:
        return
    db = SessionLocal()
    try:
        exists = db.query(User).first()
        if exists:
            return
        db.add_all(
            [
                User(
                    username="admin",
                    password_hash=hash_password("admin123"),
                    name="管理员",
                    role=UserRole.admin.value,
                ),
                User(
                    username="user",
                    password_hash=hash_password("user123"),
                    name="王小明",
                    role=UserRole.employee.value,
                ),
            ]
        )
        db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(db_session)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/api/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        role=UserRole(current_user.role),
    )


def month_submitted(db: Session, user_id: int, year: int, month: int) -> bool:
    return (
        db.query(MonthSubmission)
        .filter(MonthSubmission.user_id == user_id, MonthSubmission.year == year, MonthSubmission.month == month)
        .first()
        is not None
    )


def month_edit_granted(db: Session, user_id: int, year: int, month: int) -> bool:
    return (
        db.query(MonthEditGrant)
        .filter(MonthEditGrant.user_id == user_id, MonthEditGrant.year == year, MonthEditGrant.month == month)
        .first()
        is not None
    )


@app.get("/api/notifications", response_model=List[NotificationResponse])
def list_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(db_session)):
    rows = (
        db.query(AppNotification)
        .filter(AppNotification.user_id == current_user.id)
        .order_by(AppNotification.is_read.asc(), AppNotification.created_at.desc())
        .all()
    )
    out: List[NotificationResponse] = []
    for r in rows:
        grantMonthKey = None
        if r.grant_year is not None and r.grant_month is not None:
            grantMonthKey = f"{r.grant_year}-{r.grant_month}"
        out.append(
            NotificationResponse(
                id=r.id,
                type=r.type,  # warning|info
                date=r.date.isoformat(),
                message=r.message,
                isRead=r.is_read,
                requiresFix=r.requires_fix,
                grantMonthKey=grantMonthKey,
            )
        )
    return out


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    n = db.query(AppNotification).filter(AppNotification.id == notification_id, AppNotification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.add(n)
    db.commit()
    return {"ok": True}


class HandleNotificationRequest(BaseModel):
    reason: Optional[str] = None


@app.post("/api/notifications/{notification_id}/handle")
def handle_notification(
    notification_id: int,
    req: HandleNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    n = db.query(AppNotification).filter(AppNotification.id == notification_id, AppNotification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    n.requires_fix = False
    db.add(n)
    db.commit()
    return {"ok": True}


@app.post("/api/permissions/claim")
def claim_permission(
    req: ClaimPermissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    n = db.query(AppNotification).filter(AppNotification.id == req.notification_id, AppNotification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if n.grant_year is None or n.grant_month is None:
        raise HTTPException(status_code=400, detail="This notification has no grant month permission")
    if n.is_read:
        return {"ok": True, "alreadyClaimed": True}

    existing = (
        db.query(MonthEditGrant)
        .filter(MonthEditGrant.user_id == current_user.id, MonthEditGrant.year == n.grant_year, MonthEditGrant.month == n.grant_month)
        .first()
    )
    if not existing:
        db.add(MonthEditGrant(user_id=current_user.id, year=n.grant_year, month=n.grant_month))

    n.is_read = True
    db.add(n)
    db.commit()
    return {"ok": True}


@app.get("/api/attendance/today", response_model=AttendanceTodayResponse)
def attendance_today(current_user: User = Depends(get_current_user), db: Session = Depends(db_session)):
    today = date.today()
    rec = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == today)
        .first()
    )
    if not rec:
        return AttendanceTodayResponse(clockStatus="none")
    if rec.check_out_time:
        return AttendanceTodayResponse(clockStatus="completed", checkInTime=rec.check_in_time, checkOutTime=rec.check_out_time)
    if rec.check_in_time:
        return AttendanceTodayResponse(clockStatus="checkedIn", checkInTime=rec.check_in_time, checkOutTime=None)
    return AttendanceTodayResponse(clockStatus="none")


@app.post("/api/attendance/today/toggle", response_model=AttendanceTodayResponse)
def attendance_toggle(current_user: User = Depends(get_current_user), db: Session = Depends(db_session)):
    now = datetime.now()
    today = date.today()
    rec = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == today)
        .first()
    )
    if not rec:
        rec = AttendanceRecord(
            user_id=current_user.id,
            date=today,
            status=AttendanceStatus.normal.value,
            check_in_time=now.strftime("%H:%M"),
            check_out_time=None,
            deduct_minutes=None,
            attendance_note=None,
            needs_fix=True,
        )
        db.add(rec)
        db.commit()
    else:
        if rec.check_out_time:
            raise HTTPException(status_code=400, detail="Already completed for today")
        rec.check_out_time = now.strftime("%H:%M")
        rec.status = AttendanceStatus.completed.value
        rec.needs_fix = False
        db.add(rec)
        db.commit()

    refreshed = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == today)
        .first()
    )
    if refreshed.check_out_time:
        return AttendanceTodayResponse(clockStatus="completed", checkInTime=refreshed.check_in_time, checkOutTime=refreshed.check_out_time)
    return AttendanceTodayResponse(clockStatus="checkedIn", checkInTime=refreshed.check_in_time, checkOutTime=None)


@app.get("/api/attendance/month", response_model=AttendanceMonthResponse)
def attendance_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be 1-12")
    today = date.today()

    submitted = month_submitted(db, current_user.id, year, month)
    can_edit = (not submitted) or month_edit_granted(db, current_user.id, year, month)

    first = date(year, month, 1)
    last = (date(year, 12, 31) if month == 12 else (date(year, month + 1, 1) - timedelta(days=1)))

    records_out: List[AttendanceMonthRecordResponse] = []
    day = first
    while day <= last:
        if day.weekday() < 5:  # Mon-Fri
            rec = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == day)
                .first()
            )
            if rec:
                needsFix = bool(rec.needs_fix) or (rec.check_out_time is None)
                status_enum: AttendanceStatus
                try:
                    status_enum = AttendanceStatus(rec.status)
                except ValueError:
                    status_enum = AttendanceStatus.normal
                records_out.append(
                    AttendanceMonthRecordResponse(
                        date=day.isoformat(),
                        status=status_enum,
                        checkInTime=rec.check_in_time,
                        checkOutTime=rec.check_out_time,
                        needsFix=needsFix,
                        deductMinutes=rec.deduct_minutes,
                        attendanceNote=rec.attendance_note,
                    )
                )
            else:
                # 没有记录 -> 仅对“今天之前”的工作日补缺勤
                if day <= today:
                    records_out.append(
                        AttendanceMonthRecordResponse(
                            date=day.isoformat(),
                            status=AttendanceStatus.absent,
                            checkInTime=None,
                            checkOutTime=None,
                            needsFix=True,
                            deductMinutes=None,
                            attendanceNote=None,
                        )
                    )
        day = day + timedelta(days=1)

    records_out.sort(key=lambda r: r.date, reverse=True)
    return AttendanceMonthResponse(records=records_out, lockInfo=LockInfoResponse(submitted=submitted, canEdit=can_edit))


def require_can_edit_month_or_403(year: int, month: int, current_user: User, db: Session) -> None:
    submitted = month_submitted(db, current_user.id, year, month)
    if not submitted:
        return
    if not month_edit_granted(db, current_user.id, year, month):
        raise HTTPException(status_code=403, detail="Month is submitted and editing permission is not granted")


@app.patch("/api/attendance/{date_str}")
def update_attendance(
    date_str: str,
    req: UpdateAttendanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    require_can_edit_month_or_403(d.year, d.month, current_user, db)

    rec = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == d)
        .first()
    )
    if not rec:
        rec = AttendanceRecord(
            user_id=current_user.id,
            date=d,
            status=(req.status.value if req.status else AttendanceStatus.normal.value),
            check_in_time=None,
            check_out_time=None,
            deduct_minutes=None,
            attendance_note=None,
            needs_fix=True,
        )
        db.add(rec)

    # status/check time/deduct/note
    if req.status is not None:
        rec.status = req.status.value
    if req.checkInTime is not None:
        rec.check_in_time = req.checkInTime
    if req.checkOutTime is not None:
        rec.check_out_time = req.checkOutTime
    if req.deductMinutes is not None:
        rec.deduct_minutes = req.deductMinutes
    if req.attendanceNote is not None:
        rec.attendance_note = req.attendanceNote

    rec.needs_fix = rec.check_out_time is None
    db.add(rec)
    db.commit()
    return {"ok": True}


@app.post("/api/attendance/month/submit")
def submit_month(
    req: SubmitMonthRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    if req.month < 1 or req.month > 12:
        raise HTTPException(status_code=400, detail="month must be 1-12")
    if month_submitted(db, current_user.id, req.year, req.month):
        raise HTTPException(status_code=409, detail="Already submitted")

    try:
        db.add(MonthSubmission(user_id=current_user.id, year=req.year, month=req.month))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already submitted")

    return {"ok": True}


def time_str_to_minutes(s: Optional[str]) -> Optional[int]:
    if not s:
        return None
    try:
        hh, mm = s.split(":")
        return int(hh) * 60 + int(mm)
    except Exception:
        return None


def work_hours_from_pair(check_in_time: Optional[str], check_out_time: Optional[str]) -> float:
    a = time_str_to_minutes(check_in_time)
    b = time_str_to_minutes(check_out_time)
    if a is None or b is None:
        return 0.0
    diff = b - a
    if diff <= 0:
        diff += 24 * 60  # cross midnight
    return round((diff / 60.0) * 10) / 10.0


@app.get("/api/attendance/month/summary", response_model=AttendanceMonthSummaryResponse)
def attendance_month_summary(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be 1-12")

    first = date(year, month, 1)
    last = (date(year, 12, 31) if month == 12 else (date(year, month + 1, 1) - timedelta(days=1)))
    today = date.today()

    month_work_hours = 0.0
    month_leave_days = 0

    day = first
    while day <= last:
        if day.weekday() < 5:  # Mon-Fri
            rec = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.user_id == current_user.id, AttendanceRecord.date == day)
                .first()
            )
            if rec:
                if rec.status == AttendanceStatus.absent.value:
                    month_leave_days += 1
                month_work_hours += work_hours_from_pair(rec.check_in_time, rec.check_out_time)
            else:
                if day <= today:
                    month_leave_days += 1
        day = day + timedelta(days=1)

    return AttendanceMonthSummaryResponse(
        monthWorkHours=round(month_work_hours * 10) / 10.0,
        monthLeaveDays=month_leave_days,
    )


@app.post("/api/admin/grant-month-edit")
def admin_grant_month_edit(
    req: GrantMonthEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    if current_user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin only")

    n_user = db.query(User).filter(User.id == req.user_id).first()
    if not n_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    key = f"{req.year}-{req.month}"
    n = AppNotification(
        user_id=req.user_id,
        type="info",
        date=date.today(),
        message=f"【管理端】已为您开放本月考勤修改权限（{key}），请到“消息通知”中领取。",
        requires_fix=False,
        grant_year=req.year,
        grant_month=req.month,
        is_read=False,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"ok": True, "notificationId": n.id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

