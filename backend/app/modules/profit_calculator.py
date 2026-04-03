from backend.app.models.deal import ProfitCalculation
from backend.app.config import settings


class ProfitCalculator:
    """Modul 3: Gewinnberechnung mit realistischen Gebühren."""

    def __init__(
        self,
        fee_percent: float = settings.EBAY_FEE_PERCENT,
        default_shipping: float = settings.SHIPPING_ESTIMATE_DEFAULT,
    ):
        self.fee_percent = fee_percent
        self.default_shipping = default_shipping

    def calculate(
        self,
        purchase_price: float,
        estimated_sell_price: float,
        shipping_cost: float | None = None,
    ) -> ProfitCalculation:
        shipping = shipping_cost if shipping_cost is not None else self.default_shipping
        platform_fees = round(estimated_sell_price * self.fee_percent, 2)

        profit_euro = round(estimated_sell_price - purchase_price - shipping - platform_fees, 2)

        if purchase_price > 0:
            profit_percent = round((profit_euro / purchase_price) * 100, 2)
        else:
            profit_percent = 0.0

        return ProfitCalculation(
            purchase_price=purchase_price,
            estimated_sell_price=estimated_sell_price,
            shipping_cost=shipping,
            platform_fees=platform_fees,
            profit_euro=profit_euro,
            profit_percent=profit_percent,
        )
