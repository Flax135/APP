const API = "/api";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================================
// TAB SWITCHER
// ============================================================
$$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        $$(".tab-btn").forEach((b) => b.classList.remove("active"));
        $$(".tab-content").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        $(`#tab-${btn.dataset.tab}`).classList.add("active");
    });
});

// ============================================================
// DEALS TAB
// ============================================================
const searchInput = $("#search-input");
const maxPriceInput = $("#max-price");
const platformSelect = $("#platform-select");
const searchBtn = $("#search-btn");
const dealsGrid = $("#deals-grid");
const statsBar = $("#stats-bar");

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
    const scoreClass =
        deal.deal_score >= 90 ? "top" :
        deal.deal_score >= 70 ? "good" :
        deal.deal_score >= 50 ? "medium" : "bad";

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

    const imageUrl = l.image_urls && l.image_urls.length > 0 ? l.image_urls[0] : "";
    const imageSrc = imageUrl ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='%23636e72'%3E%3Crect width='120' height='120' fill='%232a2d3a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3EKein Bild%3C/text%3E%3C/svg%3E";

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

// ============================================================
// VIDEO EDITOR TAB
// ============================================================
const dropZone       = $("#video-drop-zone");
const videoFileInput = $("#video-file-input");
const infoBar        = $("#video-info-bar");
const infoName       = $("#video-info-name");
const infoMeta       = $("#video-info-meta");
const clearBtn       = $("#video-clear-btn");
const videoSettings  = $("#video-settings");
const videoActions   = $("#video-actions");
const videoResult    = $("#video-result");
const resultInner    = $("#result-inner");

const trimStart      = $("#trim-start");
const trimEnd        = $("#trim-end");
const speedSlider    = $("#speed-slider");
const speedLabel     = $("#speed-label");
const origVolSlider  = $("#orig-vol-slider");
const origVolLabel   = $("#orig-vol-label");
const musicVolSlider = $("#music-vol-slider");
const musicVolLabel  = $("#music-vol-label");
const titleText      = $("#title-text");
const subtitleText   = $("#subtitle-text");
const musicFileInput = $("#music-file-input");
const musicPickBtn   = $("#music-pick-btn");
const musicFileName  = $("#music-file-name");
const processBtn     = $("#process-btn");

let selectedVideoFile = null;
let selectedMusicFile = null;
let selectedPreset    = "original";

// --- Drop zone ---
dropZone.addEventListener("click", () => videoFileInput.click());
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) setVideoFile(f);
});
videoFileInput.addEventListener("change", () => {
    if (videoFileInput.files[0]) setVideoFile(videoFileInput.files[0]);
});

function setVideoFile(file) {
    selectedVideoFile = file;
    infoName.textContent = file.name;
    infoMeta.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    infoBar.style.display = "flex";
    videoSettings.style.display = "grid";
    videoActions.style.display = "flex";
    videoResult.style.display = "none";
    resultInner.innerHTML = "";

    // Pre-fill trim end with a safe 60s default
    trimEnd.value = 60;
}

clearBtn.addEventListener("click", () => {
    selectedVideoFile = null;
    videoFileInput.value = "";
    infoBar.style.display = "none";
    videoSettings.style.display = "none";
    videoActions.style.display = "none";
    videoResult.style.display = "none";
});

// --- Sliders ---
speedSlider.addEventListener("input", () => {
    speedLabel.textContent = `${parseFloat(speedSlider.value)}×`;
});
origVolSlider.addEventListener("input", () => {
    origVolLabel.textContent = `${Math.round(parseFloat(origVolSlider.value) * 100)}%`;
});
musicVolSlider.addEventListener("input", () => {
    musicVolLabel.textContent = `${Math.round(parseFloat(musicVolSlider.value) * 100)}%`;
});

// --- Color presets ---
$$(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        $$(".preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPreset = btn.dataset.preset;
    });
});

// --- Music file ---
musicPickBtn.addEventListener("click", () => musicFileInput.click());
musicFileInput.addEventListener("change", () => {
    if (musicFileInput.files[0]) {
        selectedMusicFile = musicFileInput.files[0];
        musicFileName.textContent = selectedMusicFile.name;
    }
});

// --- Process ---
processBtn.addEventListener("click", () => processVideo());

async function processVideo() {
    if (!selectedVideoFile) return;

    processBtn.disabled = true;
    videoResult.style.display = "block";
    resultInner.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Video wird bearbeitet... Das kann 10–60 Sekunden dauern.</p>
        </div>
    `;

    const form = new FormData();
    form.append("file", selectedVideoFile);
    if (selectedMusicFile) form.append("music", selectedMusicFile);

    form.append("trim_start", trimStart.value || "0");
    form.append("trim_end", trimEnd.value || "60");
    form.append("speed", speedSlider.value);
    form.append("color_preset", selectedPreset);
    form.append("title_text", titleText.value.trim());
    form.append("subtitle_text", subtitleText.value.trim());
    form.append("original_audio_volume", origVolSlider.value);
    form.append("music_volume", musicVolSlider.value);

    try {
        const resp = await fetch(`${API}/video/process`, {
            method: "POST",
            body: form,
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: resp.statusText }));
            throw new Error(err.detail || "Unbekannter Fehler");
        }

        const data = await resp.json();
        showDownload(data.job_id, data.filename);
    } catch (err) {
        resultInner.innerHTML = `
            <div class="result-error">
                <strong>Fehler:</strong> ${escapeHtml(err.message)}
            </div>
        `;
    } finally {
        processBtn.disabled = false;
    }
}

function showDownload(jobId, filename) {
    resultInner.innerHTML = `
        <div class="result-success">
            <div class="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="success-text">
                <strong>Fertig!</strong> Dein TikTok/Reels-Video ist bereit.
                <div style="font-size:0.82rem;color:var(--muted);margin-top:3px">
                    1080×1920 · 9:16 · MP4 · max. 60 Sek.
                </div>
            </div>
            <a class="btn btn-download" href="${API}/video/download/${jobId}" download="${escapeHtml(filename)}">
                Download
            </a>
        </div>
    `;
}
