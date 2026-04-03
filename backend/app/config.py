import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    EBAY_APP_ID: str = os.getenv("EBAY_APP_ID", "")
    EBAY_CERT_ID: str = os.getenv("EBAY_CERT_ID", "")
    EBAY_DEV_ID: str = os.getenv("EBAY_DEV_ID", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./deals.db")

    # eBay API endpoints
    EBAY_FINDING_API: str = "https://svcs.ebay.de/services/search/FindingService/v1"
    EBAY_BROWSE_API: str = "https://api.ebay.com/buy/browse/v1"

    # Kleinanzeigen base URL
    KLEINANZEIGEN_BASE_URL: str = "https://www.kleinanzeigen.de"

    # Fee structure
    EBAY_FEE_PERCENT: float = 0.12  # 12% eBay fees
    SHIPPING_ESTIMATE_DEFAULT: float = 5.99


settings = Settings()
