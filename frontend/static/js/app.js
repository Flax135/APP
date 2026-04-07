const API = "/api";

const $ = (sel) => document.querySelector(sel);

const searchInput  = $("#search-input");
const maxPriceInput = $("#max-price");
const platformSelect = $("#platform-select");
const searchBtn    = $("#search-btn");
const dealsGrid    = $("#deals-grid");
const statsBar     = $("#stats-bar");

// ── Events ──────────────────────────────────────────────────────────────
searchBtn.addEventListener("click", () => runSearch());
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
});

// ── Search ───────────────────────────────────────────────────────────────
async function runSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const maxPrice = maxPriceInput.value || "";
    const platforms = platformSelect.value;

    searchBtn.disabled = true;
    dealsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Analysiere Marktdaten…</p>
        </div>`;
    statsBar.innerHTML = "";

    try {
        let url = `${API}/search?q=${encodeURIComponent(query)}&platforms=${platforms}&max_results=15`;
        if (maxPrice) url += `&max_price=${maxPrice}`;

        const resp = await fetch(url);
        const data = await resp.json();

        renderStats(data);
        renderDeals(data.deals);
    } catch (err) {
        dealsGrid.innerHTML = `<div class="empty-state">
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Verbindungsfehler</p>
            <span>${escapeHtml(err.message)}</span>
        </div>`;
    } finally {
        searchBtn.disabled = false;
    }
}

// ── Stats ────────────────────────────────────────────────────────────────
function renderStats(data) {
    const deals = data.deals || [];
    const profitable = deals.filter((d) => d.profit && d.profit.profit_euro > 0).length;
    const avgScore = deals.length
        ? (deals.reduce((s, d) => s + d.deal_score, 0) / deals.length).toFixed(1)
        : 0;
    const bestDeal = deals.length ? Math.max(...deals.map((d) => d.deal_score)) : 0;

    statsBar.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <div class="stat-body">
                <div class="value">${data.total_results}</div>
                <div class="label">Ergebnisse</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            </div>
            <div class="stat-body">
                <div class="value" style="color:var(--green)">${profitable}</div>
                <div class="label">Profitabel</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
            </div>
            <div class="stat-body">
                <div class="value">${avgScore}</div>
                <div class="label">Avg Score</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon yellow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>
            <div class="stat-body">
                <div class="value" style="color:var(--yellow)">${bestDeal}</div>
                <div class="label">Bester Score</div>
            </div>
        </div>`;
}

// ── Deal List ────────────────────────────────────────────────────────────
function renderDeals(deals) {
    if (!deals || deals.length === 0) {
        dealsGrid.innerHTML = `<div class="empty-state">
            <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Keine Deals gefunden.</p>
            <span>Versuche einen anderen Suchbegriff oder erhöhe den Maximalpreis.</span>
        </div>`;
        return;
    }

    dealsGrid.innerHTML = deals
        .map((deal, i) => renderDealCard(deal, i))
        .join("");
}

// ── Deal Card ────────────────────────────────────────────────────────────
function renderDealCard(deal, index) {
    const l = deal.listing;
    const p = deal.profit;
    const r = deal.risk;
    const img = deal.image;

    const isTop = deal.deal_score >= 90;
    const scoreClass =
        deal.deal_score >= 90 ? "top" :
        deal.deal_score >= 70 ? "good" :
        deal.deal_score >= 50 ? "medium" : "bad";

    // SVG ring progress
    const radius = 28;
    const circ   = 2 * Math.PI * radius;
    const offset = circ - (deal.deal_score / 100) * circ;
    const ringId  = `ring-${index}`;

    const scoreRingHtml = `
        <div class="score-ring">
            <svg width="72" height="72" viewBox="0 0 72 72">
                <circle class="score-ring-track" cx="36" cy="36" r="${radius}"/>
                <circle class="score-ring-fill ${scoreClass}" cx="36" cy="36" r="${radius}"
                    stroke-dasharray="${circ.toFixed(1)}"
                    stroke-dashoffset="${offset.toFixed(1)}"/>
            </svg>
            <div class="score-value ${scoreClass}">${deal.deal_score}</div>
        </div>`;

    // Platform tag
    const platformTag = l.platform === "ebay"
        ? `<span class="tag ebay">eBay</span>`
        : `<span class="tag kleinanzeigen">Kleinanzeigen</span>`;

    // Profit tag
    const profitTag = p
        ? p.profit_euro > 0
            ? `<span class="tag profit">+${p.profit_euro}€ (${p.profit_percent}%)</span>`
            : `<span class="tag loss">${p.profit_euro}€</span>`
        : "";

    // Risk tag
    const riskMap = { 'niedrig': 'low', 'mittel': 'medium', 'hoch': 'high' };
    const riskTag = r
        ? `<span class="tag risk-${riskMap[r.risk_level] || 'medium'}">${r.risk_level}</span>`
        : "";

    // Image
    const imageSrc = (l.image_urls && l.image_urls.length > 0)
        ? l.image_urls[0]
        : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e2540'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%234a5568' font-size='11'%3EKein Bild%3C/text%3E%3C/svg%3E`;

    // Title link
    const titleHtml = l.url
        ? `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.title)}</a>`
        : escapeHtml(l.title);

    // Meta items
    const metaItems = [
        `<span class="deal-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ${l.price.toFixed(2)}€
        </span>`,
        p ? `<span class="deal-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            ~${p.estimated_sell_price.toFixed(2)}€
        </span>` : "",
        p ? `<span class="deal-meta-item">Gebühren: ${p.platform_fees.toFixed(2)}€</span>` : "",
        l.location ? `<span class="deal-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(l.location)}
        </span>` : "",
    ].filter(Boolean).join("");

    const conditionLine = img
        ? `<div class="deal-summary">Zustand: ${img.condition_score}/10 · Vertrauen: ${img.trust_score}/10</div>`
        : "";

    return `
        <div class="deal-card ${isTop ? "top-deal" : ""}" style="animation-delay:${index * 0.04}s">
            <div class="deal-image-wrap">
                ${isTop ? `<span class="top-badge">Top Deal</span>` : ""}
                <img class="deal-image" src="${imageSrc}" alt="${escapeHtml(l.title)}" loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%231e2540\\'/%3E%3C/svg%3E'">
            </div>
            <div class="deal-info">
                <h3 class="deal-title">${titleHtml}</h3>
                <div class="deal-meta">${metaItems}</div>
                <div class="deal-tags">
                    ${platformTag}${profitTag}${riskTag}
                </div>
                ${conditionLine}
                <div class="deal-summary">${escapeHtml(deal.summary)}</div>
            </div>
            <div class="deal-score-box">
                ${scoreRingHtml}
                <div class="score-label">${escapeHtml(deal.deal_rating)}</div>
            </div>
        </div>`;
}

// ── Utils ────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    if (!text) return "";
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}
