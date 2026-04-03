from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Platform(str, Enum):
    EBAY = "ebay"
    KLEINANZEIGEN = "kleinanzeigen"


class RiskLevel(str, Enum):
    LOW = "niedrig"
    MEDIUM = "mittel"
    HIGH = "hoch"


class DealScoreRating(str, Enum):
    TOP = "🔥 Top Deal"
    GOOD = "👍 Gut"
    MEDIUM = "⚠️ Mittel"
    BAD = "❌ Schlecht"


class ProductListing(BaseModel):
    title: str
    platform: Platform
    price: float
    currency: str = "EUR"
    url: str
    image_urls: list[str] = []
    description: str = ""
    seller_name: str = ""
    location: str = ""
    listing_date: str = ""
    category: str = ""


class MarketAnalysis(BaseModel):
    avg_sold_price: float
    min_sold_price: float
    max_sold_price: float
    num_sold: int
    demand_score: float  # 1-10
    data_confidence: str  # "sicher" / "unsicher"


class ProfitCalculation(BaseModel):
    purchase_price: float
    estimated_sell_price: float
    shipping_cost: float
    platform_fees: float
    profit_euro: float
    profit_percent: float


class ImageAnalysis(BaseModel):
    condition_score: int  # 1-10
    trust_score: int  # 1-10
    condition_description: str
    completeness: str
    fake_risk: str
    image_quality: str


class RiskAssessment(BaseModel):
    risk_level: RiskLevel
    scam_indicators: list[str]
    risk_details: str


class DealResult(BaseModel):
    listing: ProductListing
    market: Optional[MarketAnalysis] = None
    profit: Optional[ProfitCalculation] = None
    image: Optional[ImageAnalysis] = None
    risk: Optional[RiskAssessment] = None
    deal_score: float = 0.0
    deal_rating: str = ""
    summary: str = ""
