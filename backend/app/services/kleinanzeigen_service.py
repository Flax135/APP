import httpx
from bs4 import BeautifulSoup

from backend.app.models.deal import Platform, ProductListing
from backend.app.config import settings


class KleinanzeigenService:
    """Kleinanzeigen.de Integration: Suche nach Angeboten."""

    BASE_URL = settings.KLEINANZEIGEN_BASE_URL

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "de-DE,de;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    async def search(
        self,
        query: str,
        max_results: int = 20,
        max_price: float | None = None,
        location: str = "",
    ) -> list[ProductListing]:
        """Suche nach Angeboten auf Kleinanzeigen.de."""
        search_path = f"/s-{query.replace(' ', '-')}/k0" if query else "/s-/k0"
        url = f"{self.BASE_URL}{search_path}"

        params = {}
        if max_price:
            params["maxPrice"] = str(int(max_price))

        listings = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, params=params, headers=self.HEADERS)
                if response.status_code != 200:
                    return listings

                soup = BeautifulSoup(response.text, "lxml")

                # Kleinanzeigen ad cards
                articles = soup.select("article.aditem")

                for article in articles[:max_results]:
                    listing = self._parse_article(article)
                    if listing:
                        listings.append(listing)

        except Exception:
            pass

        return listings

    def _parse_article(self, article) -> ProductListing | None:
        try:
            # Title
            title_el = article.select_one("a.ellipsis")
            if not title_el:
                title_el = article.select_one("h2")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            # URL
            link = title_el.get("href", "") if title_el.name == "a" else ""
            if not link:
                link_el = article.select_one("a[href]")
                link = link_el.get("href", "") if link_el else ""
            if link and not link.startswith("http"):
                link = f"{self.BASE_URL}{link}"

            # Price
            price_el = article.select_one(".aditem-main--middle--price-shipping--price")
            if not price_el:
                price_el = article.select_one(".aditem-main--middle--price")
            if not price_el:
                return None
            price = self._parse_price(price_el.get_text(strip=True))
            if price is None:
                return None

            # Image
            image_urls = []
            img_el = article.select_one("img")
            if img_el:
                src = img_el.get("src") or img_el.get("data-src", "")
                if src:
                    image_urls.append(src)

            # Location
            loc_el = article.select_one(".aditem-main--top--left")
            location = loc_el.get_text(strip=True) if loc_el else ""

            # Date
            date_el = article.select_one(".aditem-main--top--right")
            listing_date = date_el.get_text(strip=True) if date_el else ""

            # Description snippet
            desc_el = article.select_one(".aditem-main--middle--description")
            description = desc_el.get_text(strip=True) if desc_el else ""

            return ProductListing(
                title=title,
                platform=Platform.KLEINANZEIGEN,
                price=price,
                url=link,
                image_urls=image_urls,
                description=description,
                location=location,
                listing_date=listing_date,
            )
        except Exception:
            return None

    @staticmethod
    def _parse_price(price_text: str) -> float | None:
        try:
            cleaned = price_text.lower().replace("€", "").replace("vb", "").strip()
            if "zu verschenken" in cleaned:
                return 0.0
            cleaned = cleaned.replace(".", "").replace(",", ".")
            return float(cleaned)
        except (ValueError, IndexError):
            return None
