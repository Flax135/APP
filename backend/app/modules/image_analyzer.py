import base64
import httpx
from anthropic import AsyncAnthropic

from backend.app.models.deal import ImageAnalysis
from backend.app.config import settings


class ImageAnalyzer:
    """Modul 4: KI-Bildanalyse mit Claude Vision."""

    ANALYSIS_PROMPT = """Analysiere dieses Produktbild für einen Reselling-Check. Antworte NUR im folgenden JSON-Format:

{
    "condition_score": <1-10, wobei 10 = neuwertig>,
    "trust_score": <1-10, wobei 10 = sehr vertrauenswürdig>,
    "condition_description": "<kurze Beschreibung des Zustands>",
    "completeness": "<vollständig / unvollständig / unklar>",
    "fake_risk": "<niedrig / mittel / hoch>",
    "image_quality": "<gut / mittel / schlecht>"
}

Bewerte kritisch:
- Zustand: Kratzer, Gebrauchsspuren, Verpackung
- Vollständigkeit: Zubehör sichtbar?
- Fake-Risiko: Stockfotos? Unrealistische Darstellung?
- Bildqualität: Auflösung, Beleuchtung, Winkel"""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    async def analyze(self, image_urls: list[str]) -> ImageAnalysis:
        """Analysiere Produktbilder mit Claude Vision API."""
        if not self.client or not image_urls:
            return self._default_analysis()

        try:
            # Download first image
            image_data = await self._download_image(image_urls[0])
            if not image_data:
                return self._default_analysis()

            image_b64 = base64.b64encode(image_data).decode("utf-8")

            response = await self.client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_b64,
                                },
                            },
                            {"type": "text", "text": self.ANALYSIS_PROMPT},
                        ],
                    }
                ],
            )

            return self._parse_response(response.content[0].text)

        except Exception:
            return self._default_analysis()

    async def _download_image(self, url: str) -> bytes | None:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
        except Exception:
            pass
        return None

    def _parse_response(self, text: str) -> ImageAnalysis:
        import json
        try:
            # Extract JSON from response
            start = text.index("{")
            end = text.rindex("}") + 1
            data = json.loads(text[start:end])
            return ImageAnalysis(
                condition_score=int(data.get("condition_score", 5)),
                trust_score=int(data.get("trust_score", 5)),
                condition_description=data.get("condition_description", "Nicht analysiert"),
                completeness=data.get("completeness", "unklar"),
                fake_risk=data.get("fake_risk", "mittel"),
                image_quality=data.get("image_quality", "mittel"),
            )
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._default_analysis()

    @staticmethod
    def _default_analysis() -> ImageAnalysis:
        return ImageAnalysis(
            condition_score=5,
            trust_score=5,
            condition_description="Keine Bildanalyse möglich",
            completeness="unklar",
            fake_risk="mittel",
            image_quality="nicht verfügbar",
        )
