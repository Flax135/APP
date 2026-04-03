from sqlalchemy import Column, Integer, String, Float, DateTime, Text, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from datetime import datetime

from backend.app.config import settings


class Base(DeclarativeBase):
    pass


class DealHistory(Base):
    __tablename__ = "deal_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    platform = Column(String(50), nullable=False)
    purchase_price = Column(Float, nullable=False)
    estimated_sell_price = Column(Float)
    profit_euro = Column(Float)
    profit_percent = Column(Float)
    deal_score = Column(Float)
    url = Column(Text)
    category = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(500), nullable=False)
    category = Column(String(200))
    avg_price = Column(Float)
    min_price = Column(Float)
    max_price = Column(Float)
    num_samples = Column(Integer)
    source = Column(String(50))
    recorded_at = Column(DateTime, default=datetime.utcnow)


engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
