from backend.app.models.deal import (
    DealResult,
    DealScoreRating,
    MarketAnalysis,
    ProfitCalculation,
    RiskAssessment,
    RiskLevel,
)


class DealScorer:
    """Modul 6: Deal-Score Berechnung.

    Formel: Deal Score = (Gewinn% × Nachfrage) ÷ Risiko
    Skala: 90+ = Top, 70-89 = Gut, 50-69 = Mittel, <50 = Schlecht
    """

    RISK_MULTIPLIER = {
        RiskLevel.LOW: 1.0,
        RiskLevel.MEDIUM: 2.0,
        RiskLevel.HIGH: 4.0,
    }

    def calculate_score(self, deal: DealResult) -> tuple[float, str]:
        profit_pct = deal.profit.profit_percent if deal.profit else 0.0
        demand = deal.market.demand_score if deal.market else 5.0
        risk_level = deal.risk.risk_level if deal.risk else RiskLevel.MEDIUM

        risk_divisor = self.RISK_MULTIPLIER.get(risk_level, 2.0)

        if risk_divisor == 0:
            risk_divisor = 1.0

        raw_score = (profit_pct * demand) / risk_divisor

        # Normalize to 0-100 scale
        score = max(0.0, min(100.0, raw_score))
        score = round(score, 1)

        rating = self._get_rating(score)
        return score, rating

    @staticmethod
    def _get_rating(score: float) -> str:
        if score >= 90:
            return DealScoreRating.TOP.value
        elif score >= 70:
            return DealScoreRating.GOOD.value
        elif score >= 50:
            return DealScoreRating.MEDIUM.value
        else:
            return DealScoreRating.BAD.value
