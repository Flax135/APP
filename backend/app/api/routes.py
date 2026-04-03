from fastapi import APIRouter, Query
from backend.app.services.deal_service import DealService

router = APIRouter(prefix="/api", tags=["deals"])
deal_service = DealService()


@router.get("/search")
async def search_deals(
    q: str = Query(..., description="Suchbegriff"),
    platforms: str = Query("ebay,kleinanzeigen", description="Plattformen (kommasepariert)"),
    max_price: float | None = Query(None, description="Maximaler Preis"),
    max_results: int = Query(10, ge=1, le=50, description="Max. Ergebnisse pro Plattform"),
):
    """Suche nach Deals auf eBay und Kleinanzeigen."""
    platform_list = [p.strip() for p in platforms.split(",")]
    deals = await deal_service.search_deals(
        query=q,
        platforms=platform_list,
        max_price=max_price,
        max_results=max_results,
    )
    return {
        "query": q,
        "total_results": len(deals),
        "deals": [deal.model_dump() for deal in deals],
    }


@router.get("/analyze")
async def analyze_url(
    url: str = Query(..., description="URL der Anzeige"),
):
    """Analysiere eine einzelne Anzeige."""
    deal = await deal_service.analyze_single(url)
    return deal.model_dump()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "Reselling Arbitrage Agent"}
