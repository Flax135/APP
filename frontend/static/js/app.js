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
const speedLabel       = $("#speed-label");
const origVolSlider    = $("#orig-vol-slider");
const origVolLabel     = $("#orig-vol-label");
const musicVolSlider   = $("#music-vol-slider");
const musicVolLabel    = $("#music-vol-label");
const titleText        = $("#title-text");
const subtitleText     = $("#subtitle-text");
const musicFileInput   = $("#music-file-input");
const musicPickBtn     = $("#music-pick-btn");
const musicFileName    = $("#music-file-name");
const processBtn       = $("#process-btn");
const featureToggles   = $("#feature-toggles");
const addClipBtn       = $("#add-clip-btn");
const clipsList        = $("#clips-list");

let selectedVideoFile = null;
let selectedMusicFile = null;
let selectedPreset    = "original";
let clips             = [];  // [{start, end}]

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
    featureToggles.style.display = "block";
    videoSettings.style.display = "grid";
    videoActions.style.display = "flex";
    videoResult.style.display = "none";
    resultInner.innerHTML = "";
    trimEnd.value = 60;
}

clearBtn.addEventListener("click", () => {
    selectedVideoFile = null;
    videoFileInput.value = "";
    infoBar.style.display = "none";
    featureToggles.style.display = "none";
    videoSettings.style.display = "none";
    videoActions.style.display = "none";
    videoResult.style.display = "none";
    clips = [];
    renderClips();
});

// --- Feature Toggles: grey out settings when disabled ---
function setupToggle(toggleId, ...settingIds) {
    const tog = $(`#${toggleId}`);
    if (!tog) return;
    const update = () => {
        settingIds.forEach(sid => {
            const el = $(sid);
            if (el) el.closest(".settings-card, .setting-row")
                ?.style && (el.style.opacity = tog.checked ? "" : "0.35");
        });
    };
    tog.addEventListener("change", update);
}
setupToggle("tog-color",        "#preset-grid");
setupToggle("tog-speed",        "#speed-slider");
setupToggle("tog-title-text",   "#title-text");
setupToggle("tog-subtitle-text","#subtitle-text");

// --- Multi-Clip ---
addClipBtn.addEventListener("click", () => {
    clips.push({ start: 0, end: 10 });
    renderClips();
});

function renderClips() {
    if (!clips.length) {
        clipsList.innerHTML = "";
        return;
    }
    clipsList.innerHTML = clips.map((c, i) => `
        <div class="clip-row" data-idx="${i}">
            <span class="clip-num">#${i + 1}</span>
            <input type="number" class="clip-start" value="${c.start}" min="0" step="0.5" placeholder="Start">
            <span class="clip-sep">→</span>
            <input type="number" class="clip-end" value="${c.end}" min="0" step="0.5" placeholder="Ende">
            <span class="clip-unit">s</span>
            <button class="clip-remove" data-idx="${i}">✕</button>
        </div>
    `).join("");

    clipsList.querySelectorAll(".clip-start").forEach((el, i) => {
        el.addEventListener("change", () => { clips[i].start = parseFloat(el.value) || 0; });
    });
    clipsList.querySelectorAll(".clip-end").forEach((el, i) => {
        el.addEventListener("change", () => { clips[i].end = parseFloat(el.value) || 10; });
    });
    clipsList.querySelectorAll(".clip-remove").forEach(btn => {
        btn.addEventListener("click", () => {
            clips.splice(parseInt(btn.dataset.idx), 1);
            renderClips();
        });
    });
}

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

function getToggle(id) {
    const el = $(`#${id}`);
    return el ? el.checked : true;
}

async function processVideo() {
    if (!selectedVideoFile) return;

    processBtn.disabled = true;
    videoResult.style.display = "block";

    const hasSubs = getToggle("tog-subtitles");
    const hasThumb = getToggle("tog-thumbnail");
    resultInner.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Video wird bearbeitet…${hasSubs ? " (inkl. KI-Untertitel)" : ""}</p>
            <p style="font-size:0.8rem;color:var(--muted);margin-top:6px">
                Das kann 20–90 Sekunden dauern.
            </p>
        </div>
    `;

    const form = new FormData();
    form.append("file", selectedVideoFile);
    if (selectedMusicFile) form.append("music", selectedMusicFile);

    // Schnitt
    if (clips.length > 0) {
        form.append("clips", JSON.stringify(clips.map(c => [c.start, c.end])));
    } else {
        form.append("trim_start", trimStart.value || "0");
        form.append("trim_end",   trimEnd.value   || "60");
    }

    // Einstellungen
    form.append("speed",                  speedSlider.value);
    form.append("color_preset",           selectedPreset);
    form.append("title_text",             titleText.value.trim());
    form.append("subtitle_text",          subtitleText.value.trim());
    form.append("original_audio_volume",  origVolSlider.value);
    form.append("music_volume",           musicVolSlider.value);

    // Feature-Flags
    form.append("enable_crop",          getToggle("tog-crop"));
    form.append("enable_color",         getToggle("tog-color"));
    form.append("enable_speed",         getToggle("tog-speed"));
    form.append("enable_subtitles",     getToggle("tog-subtitles"));
    form.append("enable_thumbnail",     getToggle("tog-thumbnail"));
    form.append("enable_title_text",    getToggle("tog-title-text"));
    form.append("enable_subtitle_text", getToggle("tog-subtitle-text"));

    try {
        const resp = await fetch(`${API}/video/process`, { method: "POST", body: form });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: resp.statusText }));
            throw new Error(err.detail || "Unbekannter Fehler");
        }
        const data = await resp.json();
        showDownload(data.job_id, data.filename, data.has_thumbnail);
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

function showDownload(jobId, filename, hasThumb) {
    const thumbBtn = hasThumb
        ? `<a class="btn-ghost" href="${API}/video/thumbnail/${jobId}" download="thumbnail_${jobId}.jpg" style="font-size:0.82rem">
               Thumbnail
           </a>`
        : "";

    resultInner.innerHTML = `
        <div class="result-success">
            <div class="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="success-text">
                <strong>Fertig!</strong> Dein Video ist bereit.
                <div style="font-size:0.82rem;color:var(--muted);margin-top:3px">
                    1080×1920 · 9:16 · MP4${hasThumb ? " · Thumbnail inklusive" : ""}
                </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <a class="btn btn-download" href="${API}/video/download/${jobId}" download="${escapeHtml(filename)}">
                    Video
                </a>
                ${thumbBtn}
            </div>
        </div>
    `;
}

// ============================================================
// STIL-INSPIRATION
// ============================================================
const inspireToggle     = $("#inspire-toggle");
const inspireBody       = $("#inspire-body");
const inspireChevron    = $("#inspire-chevron");
const inspireUrlSection = $("#inspire-url-section");
const inspireFileSection= $("#inspire-file-section");
const inspireUrlInput   = $("#inspire-url-input");
const inspireAnalyzeUrl = $("#inspire-analyze-url-btn");
const inspireFilePick   = $("#inspire-file-pick-btn");
const inspireFileInput  = $("#inspire-file-input");
const inspireFileName   = $("#inspire-file-name");
const inspireAnalyzeFile= $("#inspire-analyze-file-btn");
const inspireResult     = $("#inspire-result");
const inspireResultCard = $("#inspire-result-card");
const inspireApplyBtn   = $("#inspire-apply-btn");
const inspireResetBtn   = $("#inspire-reset-btn");

let currentStyleProfile = null;
let isPanelOpen = false;

// Toggle Panel
inspireToggle.addEventListener("click", () => {
    isPanelOpen = !isPanelOpen;
    inspireBody.style.display = isPanelOpen ? "block" : "none";
    inspireChevron.textContent = isPanelOpen ? "▲" : "▼";
});

// Source Tabs
$$(".inspire-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        $$(".inspire-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        if (tab.dataset.inspire === "url") {
            inspireUrlSection.style.display = "block";
            inspireFileSection.style.display = "none";
        } else {
            inspireUrlSection.style.display = "none";
            inspireFileSection.style.display = "block";
        }
    });
});

// File pick
inspireFilePick.addEventListener("click", () => inspireFileInput.click());
inspireFileInput.addEventListener("change", () => {
    if (inspireFileInput.files[0]) {
        inspireFileName.textContent = inspireFileInput.files[0].name;
    }
});

// Analyze URL
inspireAnalyzeUrl.addEventListener("click", async () => {
    const url = inspireUrlInput.value.trim();
    if (!url) return;
    await runStyleAnalysis(null, url);
});

// Analyze File
inspireAnalyzeFile.addEventListener("click", async () => {
    const file = inspireFileInput.files[0];
    if (!file) return;
    await runStyleAnalysis(file, null);
});

// Apply style to editor settings
inspireApplyBtn.addEventListener("click", () => {
    if (!currentStyleProfile) return;
    applyStyleProfile(currentStyleProfile);
});

// Reset
inspireResetBtn.addEventListener("click", () => {
    currentStyleProfile = null;
    inspireResult.style.display = "none";
    inspireResultCard.innerHTML = "";
    inspireUrlInput.value = "";
    inspireFileInput.value = "";
    inspireFileName.textContent = "Keine";
});

async function runStyleAnalysis(file, url) {
    const btn = file ? inspireAnalyzeFile : inspireAnalyzeUrl;
    btn.disabled = true;
    inspireResult.style.display = "block";
    inspireResultCard.innerHTML = `
        <div class="loading" style="padding:30px">
            <div class="spinner"></div>
            <p>Stil wird analysiert… Claude analysiert Schnitte, Farben und Ästhetik.</p>
        </div>
    `;

    const form = new FormData();
    if (file) {
        form.append("file", file);
    } else {
        form.append("url", url);
    }

    try {
        const resp = await fetch(`${API}/video/analyze-style`, {
            method: "POST",
            body: form,
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: resp.statusText }));
            throw new Error(err.detail || "Analyse fehlgeschlagen");
        }
        const profile = await resp.json();
        currentStyleProfile = profile;
        renderStyleProfile(profile);
    } catch (err) {
        inspireResultCard.innerHTML = `
            <div class="result-error">
                <strong>Fehler:</strong> ${escapeHtml(err.message)}
            </div>
        `;
    } finally {
        btn.disabled = false;
    }
}

function renderStyleProfile(p) {
    const pacingColor = p.pacing === "fast" ? "var(--green)" : p.pacing === "slow" ? "var(--yellow)" : "var(--primary)";
    const energyBar = Array.from({length: 10}, (_, i) =>
        `<span class="energy-dot ${i < p.energy_level ? 'on' : ''}"></span>`
    ).join("");

    const swatches = (p.color_palette || []).slice(0, 6).map(
        c => `<span class="color-swatch" style="background:${c}" title="${c}"></span>`
    ).join("");

    inspireResultCard.innerHTML = `
        <div class="style-profile">
            <div class="style-profile-header">
                <div class="style-title">${escapeHtml(p.source_title)}</div>
                <div class="style-meta">${p.duration}s · ${p.cut_count} Schnitte · Ø ${p.avg_shot_duration}s/Shot</div>
            </div>

            <div class="style-stats">
                <div class="style-stat">
                    <div class="style-stat-label">Pacing</div>
                    <div class="style-stat-value" style="color:${pacingColor}">${p.pacing}</div>
                </div>
                <div class="style-stat">
                    <div class="style-stat-label">Energie</div>
                    <div class="energy-bar">${energyBar}</div>
                </div>
                <div class="style-stat">
                    <div class="style-stat-label">Preset → </div>
                    <div class="style-stat-value style-preset-tag">${p.recommended_preset}</div>
                </div>
                <div class="style-stat">
                    <div class="style-stat-label">Speed → </div>
                    <div class="style-stat-value">${p.recommended_speed}×</div>
                </div>
            </div>

            ${swatches ? `
            <div class="style-colors">
                <div class="style-stat-label">Farbpalette</div>
                <div class="color-swatches">${swatches}</div>
            </div>` : ""}

            ${p.style_description ? `
            <div class="style-description">${escapeHtml(p.style_description)}</div>` : ""}

            ${p.vision_notes ? `
            <div class="style-notes">
                <strong>Editing-Beobachtungen:</strong> ${escapeHtml(p.vision_notes)}
            </div>` : ""}

            ${p.hook_type && p.hook_type !== "unknown" ? `
            <div class="style-tag-row">
                <span class="style-tag">Hook: ${p.hook_type}</span>
                <span class="style-tag">Musik: ${p.recommended_music_energy}</span>
                ${p.text_style ? `<span class="style-tag">Text: ${escapeHtml(p.text_style.slice(0,40))}</span>` : ""}
            </div>` : ""}
        </div>
    `;
}

function applyStyleProfile(p) {
    // Farbpreset anwenden
    if (p.recommended_preset) {
        $$(".preset-btn").forEach((b) => b.classList.remove("active"));
        const btn = $(`.preset-btn[data-preset="${p.recommended_preset}"]`);
        if (btn) { btn.classList.add("active"); selectedPreset = p.recommended_preset; }
    }
    // Speed anwenden
    if (p.recommended_speed) {
        speedSlider.value = p.recommended_speed;
        speedLabel.textContent = `${p.recommended_speed}×`;
    }
    // Text-Vorschläge
    if (p.suggested_title_text && !titleText.value) {
        titleText.value = p.suggested_title_text;
    }
    if (p.suggested_subtitle_text && !subtitleText.value) {
        subtitleText.value = p.suggested_subtitle_text;
    }
    // Musik-Lautstärke: energetisch → mehr Musik
    if (p.recommended_music_energy === "energetic") {
        musicVolSlider.value = 0.4;
        musicVolLabel.textContent = "40%";
    } else if (p.recommended_music_energy === "calm") {
        musicVolSlider.value = 0.2;
        musicVolLabel.textContent = "20%";
    }
    // Settings einblenden wenn noch nicht sichtbar
    if (videoSettings.style.display === "none" && selectedVideoFile) {
        videoSettings.style.display = "grid";
        videoActions.style.display = "flex";
    }
    // Feedback
    inspireApplyBtn.textContent = "✓ Stil angewendet";
    inspireApplyBtn.style.opacity = "0.7";
    setTimeout(() => {
        inspireApplyBtn.textContent = "Diesen Stil auf mein Video anwenden";
        inspireApplyBtn.style.opacity = "";
    }, 2000);
}
