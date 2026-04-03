const API = "/api";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Elements
const searchInput = $("#search-input");
const maxPriceInput = $("#max-price");
const platformSelect = $("#platform-select");
const searchBtn = $("#search-btn");
const dealsGrid = $("#deals-grid");
const statsBar = $("#stats-bar");

// Search
searchBtn.addEventListener("click", () => runSearch());
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
});

async function runSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const maxPrice = maxPriceInput.value || "";
    const platforms = platformSelect.value;

    searchBtn.disabled = true;
    dealsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Suche nach Deals...</p>
        </div>
    `;
    statsBar.innerHTML = "";

    try {
        let url = `${API}/search?q=${encodeURIComponent(query)}&platforms=${platforms}&max_results=15`;
        if (maxPrice) url += `&max_price=${maxPrice}`;

        const resp = await fetch(url);
        const data = await resp.json();

        renderStats(data);
        renderDeals(data.deals);
    } catch (err) {
        dealsGrid.innerHTML = `<div class="empty-state">Fehler bei der Suche: ${err.message}</div>`;
    } finally {
        searchBtn.disabled = false;
    }
}

function renderStats(data) {
    const deals = data.deals || [];
    const profitable = deals.filter((d) => d.profit && d.profit.profit_euro > 0);
    const avgScore = deals.length
        ? (deals.reduce((s, d) => s + d.deal_score, 0) / deals.length).toFixed(1)
        : 0;
    const bestDeal = deals.length ? Math.max(...deals.map((d) => d.deal_score)) : 0;

    statsBar.innerHTML = `
        <div class="stat">
            <div class="value">${data.total_results}</div>
            <div class="label">Ergebnisse</div>
        </div>
        <div class="stat">
            <div class="value" style="color:var(--green)">${profitable.length}</div>
            <div class="label">Profitabel</div>
        </div>
        <div class="stat">
            <div class="value">${avgScore}</div>
            <div class="label">Avg Score</div>
        </div>
        <div class="stat">
            <div class="value" style="color:var(--green)">${bestDeal}</div>
            <div class="label">Bester Score</div>
        </div>
    `;
}

function renderDeals(deals) {
    if (!deals || deals.length === 0) {
        dealsGrid.innerHTML = `<div class="empty-state">Keine Deals gefunden. Versuche einen anderen Suchbegriff.</div>`;
        return;
    }

    dealsGrid.innerHTML = deals.map((deal) => renderDealCard(deal)).join("");
}

function renderDealCard(deal) {
    const l = deal.listing;
    const p = deal.profit;
    const r = deal.risk;
    const img = deal.image;

    const isTop = deal.deal_score >= 90;
    const scoreClass = deal.deal_score >= 90 ? "top" : deal.deal_score >= 70 ? "good" : deal.deal_score >= 50 ? "medium" : "bad";

    const platformTag = l.platform === "ebay"
        ? `<span class="tag ebay">eBay</span>`
        : `<span class="tag kleinanzeigen">Kleinanzeigen</span>`;

    const profitTag = p
        ? p.profit_euro > 0
            ? `<span class="tag profit">+${p.profit_euro}€ (${p.profit_percent}%)</span>`
            : `<span class="tag loss">${p.profit_euro}€</span>`
        : "";

    const riskTag = r
        ? `<span class="tag risk-${r.risk_level === 'niedrig' ? 'low' : r.risk_level === 'mittel' ? 'medium' : 'high'}">${r.risk_level}</span>`
        : "";

    const imageUrl = l.image_urls && l.image_urls.length > 0
        ? l.image_urls[0]
        : "";

    const imageSrc = imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='%23636e72'%3E%3Crect width='120' height='120' fill='%232a2d3a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3EKein Bild%3C/text%3E%3C/svg%3E";

    const linkHtml = l.url
        ? `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.title)}</a>`
        : escapeHtml(l.title);

    const conditionInfo = img ? `Zustand: ${img.condition_score}/10 | Vertrauen: ${img.trust_score}/10` : "";

    return `
        <div class="deal-card ${isTop ? "top-deal" : ""}">
            <img class="deal-image" src="${imageSrc}" alt="${escapeHtml(l.title)}" loading="lazy" onerror="this.style.display='none'">
            <div class="deal-info">
                <h3>${linkHtml}</h3>
                <div class="deal-meta">
                    <span>Preis: ${l.price.toFixed(2)}€</span>
                    ${p ? `<span>Verkauf: ~${p.estimated_sell_price.toFixed(2)}€</span>` : ""}
                    ${p ? `<span>Gebühren: ${p.platform_fees.toFixed(2)}€</span>` : ""}
                    ${l.location ? `<span>${escapeHtml(l.location)}</span>` : ""}
                </div>
                <div class="deal-tags">
                    ${platformTag}
                    ${profitTag}
                    ${riskTag}
                </div>
                ${conditionInfo ? `<div class="deal-summary">${conditionInfo}</div>` : ""}
                <div class="deal-summary">${escapeHtml(deal.summary)}</div>
            </div>
            <div class="deal-score-box">
                <div class="score-circle ${scoreClass}">${deal.deal_score}</div>
                <div style="margin-top:8px;font-size:0.75rem;color:var(--muted)">${escapeHtml(deal.deal_rating)}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
