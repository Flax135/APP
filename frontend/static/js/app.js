/* ============================
   ResellPro - Arbitrage Agent
   Frontend Application
   ============================ */

const API = "/api";
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== Elements ==========
const searchInput = $("#search-input");
const maxPriceInput = $("#max-price");
const platformSelect = $("#platform-select");
const resultsCount = $("#results-count");
const searchBtn = $("#search-btn");
const dealsGrid = $("#deals-grid");
const statsBar = $("#stats-bar");
const analyzeUrl = $("#analyze-url");
const analyzeBtn = $("#analyze-btn");
const analyzeResult = $("#analyze-result");
const modal = $("#deal-modal");
const modalBody = $("#modal-body");
const modalClose = $("#modal-close");
const clearHistoryBtn = $("#clear-history-btn");

// ========== State ==========
let currentDeals = [];
let searchHistory = JSON.parse(localStorage.getItem("resellpro_history") || "[]");

// ========== Navigation ==========
$$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        $$(".nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".view").forEach((v) => v.classList.remove("active"));
        $(`#view-${btn.dataset.view}`).classList.add("active");

        if (btn.dataset.view === "history") renderHistory();
    });
});

// ========== Search ==========
searchBtn.addEventListener("click", () => runSearch());
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
});

async function runSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const maxPrice = maxPriceInput.value || "";
    const platforms = platformSelect.value;
    const maxResults = resultsCount.value;

    searchBtn.disabled = true;
    searchBtn.textContent = "Suche...";
    dealsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Suche nach Deals...</p>
            <small>Durchsuche eBay & Kleinanzeigen, analysiere Marktpreise...</small>
        </div>
    `;
    statsBar.innerHTML = "";

    try {
        let url = `${API}/search?q=${encodeURIComponent(query)}&platforms=${platforms}&max_results=${maxResults}`;
        if (maxPrice) url += `&max_price=${maxPrice}`;

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        currentDeals = data.deals || [];

        // Save to history
        addToHistory(query, platforms, data.total_results);

        renderStats(data);
        renderDeals(currentDeals);
    } catch (err) {
        dealsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#x26A0;&#xFE0F;</div>
                <h3>Fehler bei der Suche</h3>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `;
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Deals finden";
    }
}

// ========== URL Analyzer ==========
analyzeBtn.addEventListener("click", () => runAnalyze());
analyzeUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runAnalyze();
});

async function runAnalyze() {
    const url = analyzeUrl.value.trim();
    if (!url) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analysiere...";
    analyzeResult.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Analysiere Anzeige...</p>
            <small>Marktpreise, Bildanalyse, Risikocheck...</small>
        </div>
    `;

    try {
        const resp = await fetch(`${API}/analyze?url=${encodeURIComponent(url)}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const deal = await resp.json();

        analyzeResult.innerHTML = renderDetailCard(deal);
    } catch (err) {
        analyzeResult.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#x26A0;&#xFE0F;</div>
                <h3>Analyse fehlgeschlagen</h3>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `;
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analysieren";
    }
}

// ========== Render Stats ==========
function renderStats(data) {
    const deals = data.deals || [];
    const profitable = deals.filter((d) => d.profit && d.profit.profit_euro > 0);
    const avgScore = deals.length
        ? (deals.reduce((s, d) => s + d.deal_score, 0) / deals.length).toFixed(1)
        : 0;
    const bestDeal = deals.length ? Math.max(...deals.map((d) => d.deal_score)) : 0;
    const avgProfit = profitable.length
        ? (profitable.reduce((s, d) => s + d.profit.profit_euro, 0) / profitable.length).toFixed(2)
        : 0;

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
        <div class="stat">
            <div class="value" style="color:var(--green)">${avgProfit}&euro;</div>
            <div class="label">Avg Gewinn</div>
        </div>
    `;
}

// ========== Render Deals ==========
function renderDeals(deals) {
    if (!deals || deals.length === 0) {
        dealsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#x1F50D;</div>
                <h3>Keine Deals gefunden</h3>
                <p>Versuche einen anderen Suchbegriff oder passe die Filter an.</p>
            </div>
        `;
        return;
    }

    dealsGrid.innerHTML = deals.map((deal, idx) => renderDealCard(deal, idx)).join("");

    // Add click handlers
    $$(".deal-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            // Don't trigger if clicking a link
            if (e.target.tagName === "A") return;
            const idx = parseInt(card.dataset.index);
            if (!isNaN(idx) && currentDeals[idx]) {
                openDealModal(currentDeals[idx]);
            }
        });
    });
}

function renderDealCard(deal, index) {
    const l = deal.listing;
    const p = deal.profit;
    const r = deal.risk;
    const img = deal.image;
    const m = deal.market;

    const isTop = deal.deal_score >= 90;
    const scoreClass = deal.deal_score >= 90 ? "top" : deal.deal_score >= 70 ? "good" : deal.deal_score >= 50 ? "medium" : "bad";

    const platformTag = l.platform === "ebay"
        ? `<span class="tag ebay">eBay</span>`
        : `<span class="tag kleinanzeigen">Kleinanzeigen</span>`;

    const profitTag = p
        ? p.profit_euro > 0
            ? `<span class="tag profit">+${p.profit_euro.toFixed(2)}&euro; (${p.profit_percent.toFixed(1)}%)</span>`
            : `<span class="tag loss">${p.profit_euro.toFixed(2)}&euro;</span>`
        : "";

    const riskClass = r
        ? r.risk_level === "niedrig" ? "risk-low" : r.risk_level === "mittel" ? "risk-medium" : "risk-high"
        : "";
    const riskTag = r ? `<span class="tag ${riskClass}">${r.risk_level} Risiko</span>` : "";

    const conditionTag = img && img.condition_score
        ? `<span class="tag condition">Zustand: ${img.condition_score}/10</span>`
        : "";

    const dataTag = m && m.data_confidence === "unsicher"
        ? `<span class="tag data-unsicher">Daten unsicher</span>`
        : "";

    const imageUrl = l.image_urls && l.image_urls.length > 0 ? l.image_urls[0] : "";

    const imageHtml = imageUrl
        ? `<img class="deal-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(l.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'deal-image-placeholder\\'>&#x1F4E6;</div>'">`
        : `<div class="deal-image-placeholder">&#x1F4E6;</div>`;

    const linkHtml = l.url
        ? `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escapeHtml(l.title)}</a>`
        : escapeHtml(l.title);

    const metaParts = [];
    if (l.location) metaParts.push(l.location);
    if (l.listing_date) metaParts.push(l.listing_date);
    if (l.seller_name) metaParts.push(`Verkäufer: ${l.seller_name}`);

    const sellPriceHtml = p && p.estimated_sell_price > 0
        ? `<span class="deal-price-sell">Verkauf: ~${p.estimated_sell_price.toFixed(2)}&euro;</span>`
        : "";

    const profitPriceHtml = p
        ? p.profit_euro > 0
            ? `<span class="deal-profit-positive">+${p.profit_euro.toFixed(2)}&euro;</span>`
            : `<span class="deal-profit-negative">${p.profit_euro.toFixed(2)}&euro;</span>`
        : "";

    return `
        <div class="deal-card ${isTop ? "top-deal" : ""}" data-index="${index !== undefined ? index : ""}">
            <div class="deal-image-wrap">
                ${imageHtml}
            </div>
            <div class="deal-body">
                <div class="deal-title">${linkHtml}</div>
                <div class="deal-prices">
                    <span class="deal-price-buy">${l.price.toFixed(2)}&euro;</span>
                    ${sellPriceHtml}
                    ${profitPriceHtml}
                </div>
                <div class="deal-tags">
                    ${platformTag}
                    ${profitTag}
                    ${riskTag}
                    ${conditionTag}
                    ${dataTag}
                </div>
                ${metaParts.length ? `<div class="deal-meta-line">${metaParts.map(m => `<span>${escapeHtml(m)}</span>`).join("")}</div>` : ""}
            </div>
            <div class="deal-score-col">
                <div class="score-circle ${scoreClass}">${deal.deal_score}</div>
                <div class="score-label">${escapeHtml(deal.deal_rating)}</div>
            </div>
        </div>
    `;
}

// ========== Detailed View (inline for analyze, or modal) ==========
function renderDetailCard(deal) {
    const l = deal.listing;
    const p = deal.profit;
    const r = deal.risk;
    const img = deal.image;
    const m = deal.market;

    const scoreClass = deal.deal_score >= 90 ? "top" : deal.deal_score >= 70 ? "good" : deal.deal_score >= 50 ? "medium" : "bad";

    let html = `<div class="modal-detail">`;
    html += `<h2>${escapeHtml(l.title)}</h2>`;

    // Score + Rating
    html += `<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">`;
    html += `<div class="score-circle ${scoreClass}" style="flex-shrink:0">${deal.deal_score}</div>`;
    html += `<div>
        <div style="font-size:1.1rem;font-weight:600">${escapeHtml(deal.deal_rating)}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary)">${escapeHtml(deal.summary)}</div>
    </div>`;
    html += `</div>`;

    // Listing Info
    html += `<div class="detail-section">
        <h3>Anzeige</h3>
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Plattform</span>
                <span class="detail-value">${l.platform === "ebay" ? "eBay" : "Kleinanzeigen"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Einkaufspreis</span>
                <span class="detail-value">${l.price.toFixed(2)}&euro;</span>
            </div>
            ${l.location ? `<div class="detail-item"><span class="detail-label">Standort</span><span class="detail-value">${escapeHtml(l.location)}</span></div>` : ""}
            ${l.seller_name ? `<div class="detail-item"><span class="detail-label">Verkäufer</span><span class="detail-value">${escapeHtml(l.seller_name)}</span></div>` : ""}
        </div>
    </div>`;

    // Profit Calculation
    if (p) {
        const profitClass = p.profit_euro > 0 ? "positive" : "negative";
        html += `<div class="detail-section">
            <h3>Gewinnberechnung</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Einkaufspreis</span>
                    <span class="detail-value">${p.purchase_price.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Erwarteter Verkaufspreis</span>
                    <span class="detail-value">${p.estimated_sell_price.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Versandkosten</span>
                    <span class="detail-value">${p.shipping_cost.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Plattform-Gebühren (~12%)</span>
                    <span class="detail-value">${p.platform_fees.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gewinn</span>
                    <span class="detail-value ${profitClass}">${p.profit_euro.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gewinn %</span>
                    <span class="detail-value ${profitClass}">${p.profit_percent.toFixed(1)}%</span>
                </div>
            </div>
        </div>`;
    }

    // Market Analysis
    if (m) {
        html += `<div class="detail-section">
            <h3>Marktanalyse (verkaufte Artikel)</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Durchschnittspreis</span>
                    <span class="detail-value">${m.avg_sold_price.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Preisspanne</span>
                    <span class="detail-value">${m.min_sold_price.toFixed(2)}&euro; – ${m.max_sold_price.toFixed(2)}&euro;</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Verkaufte Artikel</span>
                    <span class="detail-value">${m.num_sold}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nachfrage-Score</span>
                    <span class="detail-value">${m.demand_score}/10</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Daten-Vertrauen</span>
                    <span class="detail-value ${m.data_confidence === "unsicher" ? "warning" : ""}">${m.data_confidence}</span>
                </div>
            </div>
        </div>`;
    }

    // Image Analysis
    if (img) {
        html += `<div class="detail-section">
            <h3>KI-Bildanalyse</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Zustand</span>
                    <span class="detail-value">${img.condition_score}/10</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Vertrauen</span>
                    <span class="detail-value">${img.trust_score}/10</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Beschreibung</span>
                    <span class="detail-value">${escapeHtml(img.condition_description)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Vollständigkeit</span>
                    <span class="detail-value">${escapeHtml(img.completeness)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fake-Risiko</span>
                    <span class="detail-value ${img.fake_risk === "hoch" ? "negative" : img.fake_risk === "mittel" ? "warning" : ""}">${escapeHtml(img.fake_risk)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Bildqualität</span>
                    <span class="detail-value">${escapeHtml(img.image_quality)}</span>
                </div>
            </div>
        </div>`;
    }

    // Risk Assessment
    if (r) {
        const riskColor = r.risk_level === "niedrig" ? "positive" : r.risk_level === "mittel" ? "warning" : "negative";
        html += `<div class="detail-section">
            <h3>Risikoanalyse</h3>
            <div class="detail-item" style="margin-bottom:12px">
                <span class="detail-label">Risikostufe</span>
                <span class="detail-value ${riskColor}">${r.risk_level.toUpperCase()}</span>
            </div>
            <div class="detail-indicators">
                ${r.scam_indicators.map((ind) => {
                    const isWarn = !ind.includes("Keine auffälligen");
                    return `<div class="indicator ${isWarn ? "warn" : "ok"}">${isWarn ? "&#x26A0;&#xFE0F;" : "&#x2705;"} ${escapeHtml(ind)}</div>`;
                }).join("")}
            </div>
        </div>`;
    }

    // Summary
    html += `<div class="detail-section">
        <h3>Kurzbewertung</h3>
        <div class="detail-summary">${escapeHtml(deal.summary)}</div>
    </div>`;

    // Link
    if (l.url) {
        html += `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="detail-link">Zur Anzeige &rarr;</a>`;
    } else {
        html += `<p style="color:var(--yellow);margin-top:12px">&#x26A0;&#xFE0F; Kein direkter Link verfügbar</p>`;
    }

    html += `</div>`;
    return html;
}

// ========== Modal ==========
function openDealModal(deal) {
    modalBody.innerHTML = renderDetailCard(deal);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeDealModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeDealModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDealModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDealModal();
});

// ========== History ==========
function addToHistory(query, platforms, totalResults) {
    const entry = {
        query,
        platforms,
        totalResults,
        timestamp: new Date().toISOString(),
    };

    // Remove duplicate queries
    searchHistory = searchHistory.filter((h) => h.query !== query);
    searchHistory.unshift(entry);

    // Keep only last 50
    if (searchHistory.length > 50) searchHistory = searchHistory.slice(0, 50);

    localStorage.setItem("resellpro_history", JSON.stringify(searchHistory));
}

function renderHistory() {
    const list = $("#history-list");
    if (!searchHistory.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#x1F4DC;</div>
                <h3>Noch kein Verlauf</h3>
                <p>Deine bisherigen Suchen erscheinen hier.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = searchHistory.map((h) => {
        const date = new Date(h.timestamp);
        const timeStr = date.toLocaleDateString("de-DE") + " " + date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        return `
            <div class="history-item" data-query="${escapeHtml(h.query)}">
                <div class="history-item-info">
                    <span class="history-item-query">${escapeHtml(h.query)}</span>
                    <span class="history-item-meta">${timeStr} &middot; ${escapeHtml(h.platforms)}</span>
                </div>
                <span class="history-item-results">${h.totalResults} Ergebnisse</span>
            </div>
        `;
    }).join("");

    // Click to re-search
    $$(".history-item").forEach((item) => {
        item.addEventListener("click", () => {
            searchInput.value = item.dataset.query;
            // Switch to search view
            $$(".nav-btn").forEach((b) => b.classList.remove("active"));
            $$(".nav-btn")[0].classList.add("active");
            $$(".view").forEach((v) => v.classList.remove("active"));
            $("#view-search").classList.add("active");
            runSearch();
        });
    });
}

clearHistoryBtn.addEventListener("click", () => {
    searchHistory = [];
    localStorage.removeItem("resellpro_history");
    renderHistory();
});

// ========== Utility ==========
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
