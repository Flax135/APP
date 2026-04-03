import httpx
from bs4 import BeautifulSoup
from backend.app.models.deal import MarketAnalysis
from backend.app.config import settings


class MarketAnalyzer:
    """Modul 2: Marktanalyse basierend auf verkauften Artikeln."""

    EBAY_SOLD_URL = "https://www.ebay.de/sch/i.html"

    async def analyze(self, query: str, category: str = "") -> MarketAnalysis:
        """Analysiere echte Verkaufspreise auf eBay (verkaufte Artikel)."""
        sold_prices = await self._fetch_sold_prices(query)

        if not sold_prices:
            return MarketAnalysis(
                avg_sold_price=0.0,
                min_sold_price=0.0,
                max_sold_price=0.0,
                num_sold=0,
                demand_score=0.0,
                data_confidence="unsicher",
            )

        avg_price = round(sum(sold_prices) / len(sold_prices), 2)
        demand = min(10.0, len(sold_prices) / 5.0)

        confidence = "sicher" if len(sold_prices) >= 10 else "unsicher"

        return MarketAnalysis(
            avg_sold_price=avg_price,
            min_sold_price=min(sold_prices),
            max_sold_price=max(sold_prices),
            num_sold=len(sold_prices),
            demand_score=round(demand, 1),
            data_confidence=confidence,
        )

    async def _fetch_sold_prices(self, query: str) -> list[float]:
        """Scrape verkaufte Artikel-Preise von eBay.de."""
        params = {
            "_nkw": query,
            "LH_Sold": "1",       # Nur verkaufte Artikel
            "LH_Complete": "1",   # Abgeschlossene Auktionen
            "_sop": "13",         # Sortierung: Preis + Versand niedrigster zuerst
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        }

        prices = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    self.EBAY_SOLD_URL, params=params, headers=headers
                )
                if response.status_code != 200:
                    return prices

                soup = BeautifulSoup(response.text, "lxml")

                # eBay sold items price selectors
                price_elements = soup.select(".s-item__price")
                for el in price_elements:
                    price_text = el.get_text(strip=True)
                    price = self._parse_price(price_text)
                    if price and price > 0:
                        prices.append(price)

        except Exception:
            pass

        return prices

    @staticmethod
    def _parse_price(price_text: str) -> float | None:
        """Parse eBay price string to float. E.g. 'EUR 29,99' -> 29.99"""
        try:
            cleaned = price_text.replace("EUR", "").replace("€", "").strip()
            # Handle range prices like "EUR 10,00 bis EUR 20,00"
            if "bis" in cleaned:
                parts = cleaned.split("bis")
                cleaned = parts[0].strip()
            cleaned = cleaned.replace(".", "").replace(",", ".")
            return float(cleaned)
        except (ValueError, IndexError):
            return None
