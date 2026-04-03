from backend.app.models.deal import DealResult, ProductListing
from backend.app.modules.market_analyzer import MarketAnalyzer
from backend.app.modules.profit_calculator import ProfitCalculator
from backend.app.modules.image_analyzer import ImageAnalyzer
from backend.app.modules.risk_analyzer import RiskAnalyzer
from backend.app.modules.deal_scorer import DealScorer
from backend.app.services.ebay_service import EbayService
from backend.app.services.kleinanzeigen_service import KleinanzeigenService


class DealService:
    """Orchestriert alle Module für eine vollständige Deal-Analyse."""

    def __init__(self):
        self.ebay = EbayService()
        self.kleinanzeigen = KleinanzeigenService()
        self.market_analyzer = MarketAnalyzer()
        self.profit_calculator = ProfitCalculator()
        self.image_analyzer = ImageAnalyzer()
        self.risk_analyzer = RiskAnalyzer()
        self.deal_scorer = DealScorer()

    async def search_deals(
        self,
        query: str,
        platforms: list[str] | None = None,
        max_price: float | None = None,
        max_results: int = 10,
    ) -> list[DealResult]:
        """Suche auf allen Plattformen und analysiere Deals."""
        if platforms is None:
            platforms = ["ebay", "kleinanzeigen"]

        all_listings: list[ProductListing] = []

        if "ebay" in platforms:
            ebay_results = await self.ebay.search(query, max_results=max_results, max_price=max_price)
            all_listings.extend(ebay_results)

        if "kleinanzeigen" in platforms:
            ka_results = await self.kleinanzeigen.search(query, max_results=max_results, max_price=max_price)
            all_listings.extend(ka_results)

        # Get market data once for the query
        market_data = await self.market_analyzer.analyze(query)

        # Analyze each listing
        deals: list[DealResult] = []
        for listing in all_listings:
            deal = await self._analyze_listing(listing, market_data)
            deals.append(deal)

        # Sort by deal score descending
        deals.sort(key=lambda d: d.deal_score, reverse=True)
        return deals

    async def analyze_single(self, url: str) -> DealResult:
        """Analysiere eine einzelne Anzeige anhand der URL."""
        # Determine platform from URL
        listing = ProductListing(
            title="Einzelanalyse",
            platform="ebay" if "ebay" in url else "kleinanzeigen",
            price=0.0,
            url=url,
        )

        market_data = await self.market_analyzer.analyze(listing.title)
        return await self._analyze_listing(listing, market_data)

    async def _analyze_listing(self, listing, market_data) -> DealResult:
        deal = DealResult(listing=listing)

        # Market analysis
        deal.market = market_data

        # Profit calculation
        if market_data and market_data.avg_sold_price > 0:
            deal.profit = self.profit_calculator.calculate(
                purchase_price=listing.price,
                estimated_sell_price=market_data.avg_sold_price,
            )

        # Image analysis
        if listing.image_urls:
            deal.image = await self.image_analyzer.analyze(listing.image_urls)

        # Risk analysis
        deal.risk = self.risk_analyzer.analyze(listing, market_data, deal.image)

        # Deal score
        deal.deal_score, deal.deal_rating = self.deal_scorer.calculate_score(deal)

        # Summary
        deal.summary = self._generate_summary(deal)

        return deal

    @staticmethod
    def _generate_summary(deal: DealResult) -> str:
        parts = []

        if deal.profit:
            if deal.profit.profit_euro > 0:
                parts.append(f"Potenzieller Gewinn: {deal.profit.profit_euro}€ ({deal.profit.profit_percent}%)")
            else:
                parts.append(f"Verlust erwartet: {deal.profit.profit_euro}€")

        if deal.risk:
            parts.append(f"Risiko: {deal.risk.risk_level.value}")

        if deal.market and deal.market.data_confidence == "unsicher":
            parts.append("Marktdaten unsicher – mit Vorsicht bewerten")

        if deal.image:
            parts.append(f"Zustand: {deal.image.condition_score}/10")

        parts.append(f"Deal Score: {deal.deal_score} – {deal.deal_rating}")

        return " | ".join(parts)
