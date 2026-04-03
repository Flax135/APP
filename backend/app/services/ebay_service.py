import httpx
from bs4 import BeautifulSoup

from backend.app.models.deal import Platform, ProductListing
from backend.app.config import settings


class EbayService:
    """eBay-Integration: Suche nach aktiven Angeboten auf eBay.de."""

    SEARCH_URL = "https://www.ebay.de/sch/i.html"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "de-DE,de;q=0.9",
    }

    async def search(
        self,
        query: str,
        max_results: int = 20,
        max_price: float | None = None,
        category: str = "",
        sort: str = "newly_listed",
    ) -> list[ProductListing]:
        """Suche nach Angeboten auf eBay.de."""
        sort_map = {
            "newly_listed": "10",
            "price_low": "15",
            "price_high": "16",
            "ending_soon": "1",
        }

        params = {
            "_nkw": query,
            "_sop": sort_map.get(sort, "10"),
            "_ipg": str(min(max_results, 50)),
            "LH_PrefLoc": "1",   # Deutschland bevorzugt
        }

        if max_price:
            params["_udhi"] = str(max_price)

        listings = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(self.SEARCH_URL, params=params, headers=self.HEADERS)
                if response.status_code != 200:
                    return listings

                soup = BeautifulSoup(response.text, "lxml")
                items = soup.select(".s-item")

                for item in items[:max_results]:
                    listing = self._parse_item(item)
                    if listing:
                        listings.append(listing)

        except Exception:
            pass

        return listings

    def _parse_item(self, item) -> ProductListing | None:
        try:
            # Title
            title_el = item.select_one(".s-item__title")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)
            if title.lower() in ("shop on ebay", "ergebnisse"):
                return None

            # Price
            price_el = item.select_one(".s-item__price")
            if not price_el:
                return None
            price = self._parse_price(price_el.get_text(strip=True))
            if price is None or price <= 0:
                return None

            # URL
            link_el = item.select_one("a.s-item__link")
            url = link_el["href"] if link_el else ""
            # Clean tracking params
            if "?" in url:
                url = url.split("?")[0]

            # Image
            img_el = item.select_one("img")
            image_urls = []
            if img_el:
                src = img_el.get("src") or img_el.get("data-src", "")
                if src and "gif" not in src:
                    image_urls.append(src)

            # Seller
            seller_el = item.select_one(".s-item__seller-info-text")
            seller = seller_el.get_text(strip=True) if seller_el else ""

            # Location
            location_el = item.select_one(".s-item__location")
            location = location_el.get_text(strip=True) if location_el else ""

            return ProductListing(
                title=title,
                platform=Platform.EBAY,
                price=price,
                url=url,
                image_urls=image_urls,
                seller_name=seller,
                location=location,
            )
        except Exception:
            return None

    @staticmethod
    def _parse_price(price_text: str) -> float | None:
        try:
            cleaned = price_text.replace("EUR", "").replace("€", "").strip()
            if "bis" in cleaned:
                cleaned = cleaned.split("bis")[0].strip()
            cleaned = cleaned.replace(".", "").replace(",", ".")
            return float(cleaned)
        except (ValueError, IndexError):
            return None
