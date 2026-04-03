from backend.app.models.deal import (
    ImageAnalysis,
    MarketAnalysis,
    ProductListing,
    RiskAssessment,
    RiskLevel,
)


class RiskAnalyzer:
    """Modul 5: Risikoanalyse – Scam-Erkennung und Bewertung."""

    def analyze(
        self,
        listing: ProductListing,
        market: MarketAnalysis | None = None,
        image: ImageAnalysis | None = None,
    ) -> RiskAssessment:
        indicators: list[str] = []
        risk_score = 0  # 0-100, higher = riskier

        # 1. Unrealistisch niedriger Preis
        if market and market.avg_sold_price > 0:
            price_ratio = listing.price / market.avg_sold_price
            if price_ratio < 0.3:
                indicators.append("Preis ist unter 30% des Marktwerts – sehr verdächtig")
                risk_score += 35
            elif price_ratio < 0.5:
                indicators.append("Preis ist unter 50% des Marktwerts – auffällig günstig")
                risk_score += 20

        # 2. Fehlende Informationen
        if not listing.description or len(listing.description) < 20:
            indicators.append("Sehr kurze oder fehlende Beschreibung")
            risk_score += 15

        if not listing.seller_name:
            indicators.append("Kein Verkäufername angegeben")
            risk_score += 10

        if not listing.image_urls:
            indicators.append("Keine Bilder vorhanden")
            risk_score += 20

        # 3. Bildanalyse-basiertes Risiko
        if image:
            if image.trust_score <= 3:
                indicators.append(f"Niedriger Bild-Vertrauensscore: {image.trust_score}/10")
                risk_score += 20
            if image.fake_risk == "hoch":
                indicators.append("Hohes Fake-Risiko bei Bildern erkannt")
                risk_score += 25

        # 4. Verdächtige Muster
        title_lower = listing.title.lower()
        scam_keywords = ["original verpackt", "ovp sealed", "100% echt", "schnäppchen", "muss weg"]
        for keyword in scam_keywords:
            if keyword in title_lower:
                indicators.append(f"Verdächtiges Keyword: '{keyword}'")
                risk_score += 5

        # Determine risk level
        if risk_score >= 50:
            level = RiskLevel.HIGH
        elif risk_score >= 25:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        if not indicators:
            indicators.append("Keine auffälligen Risikofaktoren erkannt")

        details = f"Risiko-Score: {risk_score}/100. " + "; ".join(indicators)

        return RiskAssessment(
            risk_level=level,
            scam_indicators=indicators,
            risk_details=details,
        )
