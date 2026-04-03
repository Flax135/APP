from fastapi import APIRouter, Query, HTTPException
from backend.app.services.deal_service import DealService
from backend.app.models.database import async_session, DealHistory
from sqlalchemy import select, desc

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

    # Save profitable deals to history
    for deal in deals:
        if deal.profit and deal.profit.profit_euro > 0:
            try:
                async with async_session() as session:
                    entry = DealHistory(
                        title=deal.listing.title,
                        platform=deal.listing.platform.value,
                        purchase_price=deal.listing.price,
                        estimated_sell_price=deal.profit.estimated_sell_price,
                        profit_euro=deal.profit.profit_euro,
                        profit_percent=deal.profit.profit_percent,
                        deal_score=deal.deal_score,
                        url=deal.listing.url,
                    )
                    session.add(entry)
                    await session.commit()
            except Exception:
                pass

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
    try:
        deal = await deal_service.analyze_single(url)
        return deal.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
):
    """Letzte analysierte Deals aus der Datenbank."""
    try:
        async with async_session() as session:
            result = await session.execute(
                select(DealHistory).order_by(desc(DealHistory.created_at)).limit(limit)
            )
            deals = result.scalars().all()
            return [
                {
                    "id": d.id,
                    "title": d.title,
                    "platform": d.platform,
                    "purchase_price": d.purchase_price,
                    "estimated_sell_price": d.estimated_sell_price,
                    "profit_euro": d.profit_euro,
                    "profit_percent": d.profit_percent,
                    "deal_score": d.deal_score,
                    "url": d.url,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                }
                for d in deals
            ]
    except Exception:
        return []


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "ResellPro Arbitrage Agent"}
