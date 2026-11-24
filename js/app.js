/**
 * app.js — Controlador Editorial del Portal Web Oficial (Obsidian & Gold 2026)
 * - Hero Adaptativo 9:16 vs 16:9 sin recortar rostros ni titulares.
 * - Chips de filtro con contadores reales de catálogo.
 * - Cine-Modal que conmuta automáticamente entre formato vertical 9:16 y panorámico 16:9.
 */

document.addEventListener("DOMContentLoaded", function () {
    let allVideos = [];
    let currentFilter = "all";
    let currentSearch = "";
    let visibleCount = 12;
    const PAGE_SIZE = 12;

    const videoGrid = document.getElementById("video-grid");
    const searchInput = document.getElementById("search-input");
    const searchClearBtn = document.getElementById("search-clear-btn");
    const searchShortcutHint = document.getElementById("search-shortcut-hint");
    const filterContainer = document.getElementById("filter-chips");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const videoCountLabel = document.getElementById("video-count-label");
    const heroStatCount = document.getElementById("hero-stat-count");
    const featuredContainer = document.getElementById("hero-featured-video");
    const modal = document.getElementById("video-modal");
    const modalShell = document.getElementById("video-modal-shell");
    const modalIframeContainer = document.getElementById("modal-iframe-container");
    const modalTitle = document.getElementById("modal-title");
    const modalYoutubeBtn = document.getElementById("modal-youtube-link");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const quoteContainer = document.getElementById("daily-quote");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileNavDrawer = document.getElementById("mobile-nav-drawer");

    function escAttr(s) {
        return String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
    }

    // Menú móvil
    if (mobileMenuBtn && mobileNavDrawer) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileNavDrawer.classList.toggle("hidden");
        });
        mobileNavDrawer.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => mobileNavDrawer.classList.add("hidden"));
        });
    }

    // Cita curada del día
    const QUOTES = [
        { text: "No nos atrevemos a muchas cosas porque son difíciles, pero son difíciles porque no nos atrevemos.", author: "Séneca" },
        { text: "Tienes poder sobre tu mente, no sobre los acontecimientos. Comprende esto y hallarás tu fuerza.", author: "Marco Aurelio" },
        { text: "No es lo que te ocurre, sino cómo reaccionas ante ello lo que define tu destino.", author: "Epicteto" },
        { text: "Saber y no actuar es todavía no saber.", author: "Wang Yangming" },
        { text: "No sigas las huellas de los antiguos maestros; busca lo que ellos buscaron.", author: "Matsuo Bashō" },
        { text: "La mayor victoria es la que se conquista en silencio sobre uno mismo.", author: "Platón" }
    ];

    if (quoteContainer) {
        const todayIdx = (new Date().getDate() + new Date().getMonth()) % QUOTES.length;
        const q = QUOTES[todayIdx];
        quoteContainer.innerHTML = `
            <blockquote class="italic text-slate-200/95 font-light text-sm md:text-base leading-relaxed">“${q.text}”</blockquote>
            <span class="block mt-2 text-xs font-semibold text-gold-400 tracking-widest uppercase">— ${q.author}</span>
        `;
    }

    // Cargar catálogo JSON
    fetch("data/videos.json?t=" + Date.now(), { cache: "no-store" })
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar data/videos.json");
            return res.json();
        })
        .then(data => {
            allVideos = data.videos || [];
            if (heroStatCount && allVideos.length > 0) {
                heroStatCount.textContent = `${allVideos.length}`;
            }
            setupHeroFeatured(allVideos);
            renderFilterChips(data.metadata ? data.metadata.categories : []);
            applyFiltersAndRender();
        })
        .catch(err => {
            console.error("Error cargando videos:", err);
            if (videoGrid) {
                videoGrid.innerHTML = `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <p class="text-xl font-cinzel">Catálogo temporalmente no disponible.</p>
                    </div>
                `;
            }
        });

    // Hero Adaptativo: respeta 9:16 completo si el estreno es un Short, o 16:9 si es Documental
    function setupHeroFeatured(videos) {
        if (!featuredContainer || videos.length === 0) return;
        const featured = videos.find(v => v.youtube_id) || videos[0];
        if (!featured) return;

        const isShort = featured.format === "9:16" || featured.type === "short";
        const safeTitle = escAttr(featured.title);

        if (isShort) {
            featuredContainer.innerHTML = `
                <div class="relative mx-auto max-w-[330px] group">
                    <div class="absolute -inset-3 bg-gradient-to-b from-gold-500/20 via-transparent to-gold-500/10 rounded-[2rem] blur-2xl pointer-events-none"></div>
                    <div class="relative rounded-3xl overflow-hidden border border-gold-400/35 shadow-2xl bg-obsidian-900 aspect-[9/16]">
                        <img src="${featured.thumbnail_url}" alt="${featured.title.replace(/"/g, '&quot;')}" 
                             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" 
                             onerror="if(!this.dataset.r && '${featured.youtube_id}'){this.dataset.r='1';this.src='https://i.ytimg.com/vi/${featured.youtube_id}/hqdefault.jpg';}else{this.src='assets/banner.jpg';}" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/30 flex flex-col justify-between p-5">
                            <div class="flex items-center justify-between">
                                <span class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gold-400 text-obsidian-950 shadow">
                                    ✦ Último Estreno
                                </span>
                                <span class="px-2.5 py-0.5 rounded-md text-[11px] font-mono-num bg-black/75 text-slate-200 border border-white/10">
                                    ${featured.duration_formatted || '9:16'}
                                </span>
                            </div>
                            <div>
                                <h3 class="text-base sm:text-lg font-bold text-white mb-3 leading-snug font-cinzel line-clamp-2">
                                    ${featured.title}
                                </h3>
                                <div class="grid grid-cols-2 gap-2.5">
                                    <button onclick="window.openVideoModal('${featured.youtube_id}', '${safeTitle}', '${featured.format}')" 
                                            class="btn-gold py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        <span>Reproducir</span>
                                    </button>
                                    <a href="${featured.youtube_url}" target="_blank" rel="noopener noreferrer"
                                       class="btn-outline-gold py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md">
                                        <span>YouTube</span>
                                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            featuredContainer.innerHTML = `
                <div class="relative group rounded-3xl overflow-hidden shadow-2xl border border-gold-400/35 bg-obsidian-900 aspect-video flex items-center justify-center">
                    <img src="${featured.thumbnail_url}" alt="${featured.title.replace(/"/g, '&quot;')}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='assets/banner.jpg'" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-400 text-obsidian-950 w-max mb-2">
                            ✦ Documental Destacado
                        </span>
                        <h3 class="text-xl md:text-2xl font-bold text-white mb-3 leading-snug font-cinzel line-clamp-2">
                            ${featured.title}
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            <button onclick="window.openVideoModal('${featured.youtube_id}', '${safeTitle}', '${featured.format}')" 
                                    class="btn-gold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer">
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                Reproducir
                            </button>
                            <a href="${featured.youtube_url}" target="_blank" rel="noopener noreferrer" class="btn-outline-gold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                                <span>YouTube</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Chips con conteo exacto
    function renderFilterChips(categories) {
        if (!filterContainer) return;
        const shortsCount = allVideos.filter(v => v.type === "short").length;
        const longCount = allVideos.filter(v => v.type === "documental").length;

        const baseFilters = [
            { id: "all", label: `Todos (${allVideos.length})` },
            { id: "format_short", label: `⚡ Shorts 9:16 (${shortsCount})` },
            { id: "format_long", label: `🎬 Documentales 16:9 (${longCount})` }
        ];

        let html = baseFilters.map(f => `
            <button class="filter-chip px-4 py-2 rounded-xl text-xs font-medium text-slate-300 cursor-pointer ${f.id === currentFilter ? 'active' : ''}" 
                    data-filter="${f.id}">
                ${f.label}
            </button>
        `).join("");

        (categories || []).forEach(cat => {
            const cCount = allVideos.filter(v => v.category === cat).length;
            if (cCount > 0) {
                html += `
                    <button class="filter-chip px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 cursor-pointer" 
                            data-filter="cat:${cat}">
                        ${cat} <span class="opacity-60 font-mono-num">(${cCount})</span>
                    </button>
                `;
            }
        });

        filterContainer.innerHTML = html;

        filterContainer.querySelectorAll(".filter-chip").forEach(btn => {
            btn.addEventListener("click", function () {
                filterContainer.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentFilter = this.getAttribute("data-filter");
                visibleCount = PAGE_SIZE;
                if (window.Analytics) window.Analytics.trackFilterSelect(currentFilter);
                applyFiltersAndRender();
            });
        });
    }

    function applyFiltersAndRender() {
        if (!videoGrid) return;

        let filtered = allVideos.filter(v => {
            if (currentFilter === "format_short" && v.type !== "short") return false;
            if (currentFilter === "format_long" && v.type !== "documental") return false;
            if (currentFilter.startsWith("cat:") && v.category !== currentFilter.replace("cat:", "")) return false;

            if (currentSearch.trim()) {
                const q = currentSearch.toLowerCase();
                const inTitle = (v.title || "").toLowerCase().includes(q);
                const inDesc = (v.description || "").toLowerCase().includes(q);
                const inTags = (v.tags || []).some(t => t.toLowerCase().includes(q));
                const inCat = (v.category || "").toLowerCase().includes(q);
                if (!inTitle && !inDesc && !inTags && !inCat) return false;
            }
            return true;
        });

        if (videoCountLabel) {
            videoCountLabel.textContent = `Mostrando ${Math.min(visibleCount, filtered.length)} de ${filtered.length} obras`;
        }

        const toShow = filtered.slice(0, visibleCount);

        if (toShow.length === 0) {
            videoGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400 glass-panel rounded-3xl">
                    <p class="text-lg font-cinzel text-white">Sin coincidencias para esa búsqueda</p>
                    <p class="text-xs mt-2 text-slate-400">Prueba con otro personaje o época histórica.</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
            return;
        }

        videoGrid.innerHTML = toShow.map(v => createVideoCardHTML(v)).join("");
        if (loadMoreBtn) {
            loadMoreBtn.style.display = visibleCount < filtered.length ? "inline-flex" : "none";
        }
    }

    function createVideoCardHTML(v) {
        const isShort = v.type === "short";
        const formatBadge = isShort ? "Short 9:16" : "Doc 16:9";
        const badgeStyle = isShort
            ? "bg-black/70 text-gold-300 border-gold-400/35"
            : "bg-sky-950/80 text-sky-300 border-sky-400/35";
        const safeTitle = escAttr(v.title);

        return `
            <article class="glass-panel gold-border-glow rounded-2xl overflow-hidden flex flex-col group">
                <div class="relative overflow-hidden ${isShort ? 'aspect-[9/16]' : 'aspect-video'} bg-obsidian-950 cursor-pointer"
                     onclick="window.openVideoModal('${v.youtube_id}', '${safeTitle}', '${v.format}')">
                    <img src="${v.thumbnail_url}" alt="${(v.title || '').replace(/"/g, '&quot;')}" 
                         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" 
                         onerror="if(!this.dataset.retried && '${v.youtube_id}'){this.dataset.retried='1';this.src='https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg';}else{this.src='assets/banner.jpg';}" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="w-12 h-12 rounded-full bg-gold-400/95 text-obsidian-950 flex items-center justify-center shadow-xl transform scale-90 opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all">
                            <svg class="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </span>
                    </div>
                    <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeStyle} backdrop-blur-md">
                        ${formatBadge}
                    </span>
                    <span class="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-mono-num bg-black/80 text-slate-100 border border-white/10">
                        ${v.duration_formatted || ''}
                    </span>
                </div>
                <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <span class="text-[10px] font-semibold text-gold-400 tracking-widest uppercase mb-1.5 block">
                            ${v.category || 'Sabiduría Universal'}
                        </span>
                        <h4 class="text-sm sm:text-base font-bold text-white mb-2 leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors">
                            ${(v.title || '').replace(/\s*#Shorts\b/i, '')}
                        </h4>
                    </div>
                    <div class="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span class="text-slate-500 font-mono-num">${v.created_at || ''}</span>
                        <a href="${v.youtube_url}" target="_blank" rel="noopener noreferrer" 
                           onclick="window.Analytics && window.Analytics.trackYouTubeClick('${v.youtube_id}', '${safeTitle}', '${v.format}')"
                           class="text-gold-300 font-semibold hover:text-gold-400 flex items-center gap-1">
                            <span>YouTube</span>
                            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    // Buscador reactivo + atajo '/' + limpiar
    function syncSearchUI() {
        const hasVal = currentSearch.trim().length > 0;
        if (searchClearBtn) searchClearBtn.classList.toggle("hidden", !hasVal);
        if (searchShortcutHint) searchShortcutHint.style.display = hasVal ? "none" : "";
    }

    if (searchInput) {
        let timer = null;
        searchInput.addEventListener("input", function (e) {
            currentSearch = e.target.value;
            syncSearchUI();
            clearTimeout(timer);
            timer = setTimeout(() => {
                visibleCount = PAGE_SIZE;
                if (window.Analytics) window.Analytics.trackSearchQuery(currentSearch);
                applyFiltersAndRender();
            }, 220);
        });
    }

    if (searchClearBtn && searchInput) {
        searchClearBtn.addEventListener("click", () => {
            searchInput.value = "";
            currentSearch = "";
            visibleCount = PAGE_SIZE;
            syncSearchUI();
            applyFiltersAndRender();
            searchInput.focus();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "/" && document.activeElement !== searchInput && !["INPUT", "TEXTAREA"].includes((document.activeElement || {}).tagName)) {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", function () {
            visibleCount += PAGE_SIZE;
            applyFiltersAndRender();
        });
    }

    // Cine-Modal Adaptativo (9:16 Vertical real para Shorts vs 16:9 para Documentales)
    window.openVideoModal = function (youtubeId, title, format) {
        if (!modal || !modalIframeContainer) return;

        if (window.Analytics) window.Analytics.trackVideoModalOpen(youtubeId, title, format);
        if (modalTitle) modalTitle.textContent = (title || "").replace(/\s*#Shorts\b/i, "");

        const isShort = format === "9:16";
        const ytUrl = isShort
            ? `https://www.youtube.com/shorts/${youtubeId}`
            : `https://www.youtube.com/watch?v=${youtubeId}`;

        if (modalYoutubeBtn) modalYoutubeBtn.href = ytUrl;

        if (modalShell) {
            modalShell.classList.toggle("modal-shell--vertical", isShort);
            modalShell.classList.toggle("modal-shell--wide", !isShort);
        }
        modalIframeContainer.className = isShort
            ? "relative w-full aspect-[9/16] max-h-[80vh] bg-black"
            : "relative w-full aspect-video bg-black";

        modalIframeContainer.innerHTML = `
            <iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1" 
                    title="${(title || '').replace(/"/g, '&quot;')}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    class="w-full h-full">
            </iframe>
        `;

        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.style.overflow = "hidden";
    };

    window.closeVideoModal = function () {
        if (!modal || !modalIframeContainer) return;
        modalIframeContainer.innerHTML = "";
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.style.overflow = "";
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", window.closeVideoModal);
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) window.closeVideoModal();
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
            window.closeVideoModal();
        }
    });

    const devocionalBtn = document.getElementById("devocional-download-btn");
    if (devocionalBtn) {
        devocionalBtn.addEventListener("click", function () {
            if (window.Analytics) window.Analytics.trackLeadDownload("LIBRO_MAESTRO_SABIDURIA_Y_TRASCENDENCIA.pdf");
        });
    }

    const subBtn = document.getElementById("header-subscribe-btn");
    if (subBtn) {
        subBtn.addEventListener("click", function () {
            if (window.Analytics) window.Analytics.trackSubscribeClick("header_navbar");
        });
    }
});
