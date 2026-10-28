/**
 * app.js - Lógica Principal del Portal Web Oficial
 */

document.addEventListener("DOMContentLoaded", function () {
    let allVideos = [];
    let currentFilter = "all";
    let currentSearch = "";
    let visibleCount = 12;
    const PAGE_SIZE = 12;

    // Elementos del DOM
    const videoGrid = document.getElementById("video-grid");
    const searchInput = document.getElementById("search-input");
    const filterContainer = document.getElementById("filter-chips");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const videoCountLabel = document.getElementById("video-count-label");
    const featuredContainer = document.getElementById("hero-featured-video");
    const modal = document.getElementById("video-modal");
    const modalIframeContainer = document.getElementById("modal-iframe-container");
    const modalTitle = document.getElementById("modal-title");
    const modalYoutubeBtn = document.getElementById("modal-youtube-link");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const quoteContainer = document.getElementById("daily-quote");

    // Frases estoicas y de sabiduría diaria
    const QUOTES = [
        { text: "No nos atrevemos a muchas cosas porque son difíciles, pero son difíciles porque no nos atrevemos.", author: "Séneca" },
        { text: "Tienes poder sobre tu mente, no sobre los acontecimientos. Comprende esto y hallarás tu fuerza.", author: "Marco Aurelio" },
        { text: "No es lo que te ocurre, sino cómo reaccionas ante ello lo que importa.", author: "Epicteto" },
        { text: "Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida.", author: "Proverbios 4:23" },
        { text: "El desierto no es un castigo, es la fragua donde Dios forja las voluntades invencibles.", author: "San Jerónimo" },
        { text: "La mayor victoria es la que se conquista sobre uno mismo.", author: "Platón" }
    ];

    // 1. Mostrar Frase del Día
    if (quoteContainer) {
        const todayIdx = (new Date().getDate() + new Date().getMonth()) % QUOTES.length;
        const q = QUOTES[todayIdx];
        quoteContainer.innerHTML = `
            <blockquote class="italic text-slate-300 font-light text-base md:text-lg">"${q.text}"</blockquote>
            <span class="block mt-2 text-xs md:text-sm font-semibold text-amber-400 tracking-wider">— ${q.author}</span>
        `;
    }

    // 2. Cargar catálogo de videos
    fetch("data/videos.json")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar el archivo data/videos.json");
            return res.json();
        })
        .then(data => {
            allVideos = data.videos || [];
            setupHeroFeatured(allVideos);
            renderFilterChips(data.metadata ? data.metadata.categories : []);
            applyFiltersAndRender();
        })
        .catch(err => {
            console.error("Error cargando videos:", err);
            if (videoGrid) {
                videoGrid.innerHTML = `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <p class="text-xl">No se pudo cargar el catálogo de videos en este momento.</p>
                        <p class="text-sm mt-2 text-slate-500">Asegúrate de ejecutar el sincronizador local: <code>python backend/sync_website_catalog.py</code></p>
                    </div>
                `;
            }
        });

    // 3. Configurar Video Destacado del Hero
    function setupHeroFeatured(videos) {
        if (!featuredContainer || videos.length === 0) return;
        // Priorizar el último video con YouTube ID
        const featured = videos.find(v => v.youtube_id) || videos[0];
        if (!featured) return;

        featuredContainer.innerHTML = `
            <div class="relative group rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30 bg-slate-900 aspect-video flex items-center justify-center">
                <img src="${featured.thumbnail_url}" alt="${featured.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='assets/banner.jpg'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 w-max mb-2">
                        ⭐ Video Destacado de la Semana
                    </span>
                    <h3 class="text-xl md:text-2xl font-bold text-white mb-2 leading-snug font-cinzel line-clamp-2">
                        ${featured.title}
                    </h3>
                    <p class="text-slate-300 text-xs md:text-sm line-clamp-2 mb-4 font-light">
                        ${featured.description || "Un viaje a través de la templanza, la disciplina interior y el autodominio estoico."}
                    </p>
                    <div class="flex flex-wrap gap-3">
                        <button onclick="window.openVideoModal('${featured.youtube_id}', '${featured.title.replace(/'/g, "\\'")}', '${featured.format}')" 
                                class="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer">
                            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Ver en la Web
                        </button>
                        <a href="${featured.youtube_url}" target="_blank" rel="noopener noreferrer" 
                           onclick="window.Analytics && window.Analytics.trackYouTubeClick('${featured.youtube_id}', '${featured.title.replace(/'/g, "\\'")}', '${featured.format}')"
                           class="btn-outline-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                            <span>Ver en YouTube</span>
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // 4. Renderizar chips de filtro
    function renderFilterChips(categories) {
        if (!filterContainer) return;
        const baseFilters = [
            { id: "all", label: "Todos los Videos" },
            { id: "format_short", label: "⚡ Shorts (9:16)" },
            { id: "format_long", label: "🎬 Documentales (16:9)" }
        ];

        let html = baseFilters.map(f => `
            <button class="filter-chip px-4 py-2 rounded-xl text-xs md:text-sm font-medium border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-400 hover:text-white cursor-pointer ${f.id === currentFilter ? 'active' : ''}" 
                    data-filter="${f.id}">
                ${f.label}
            </button>
        `).join("");

        categories.forEach(cat => {
            html += `
                <button class="filter-chip px-4 py-2 rounded-xl text-xs md:text-sm font-medium border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-400 hover:text-white cursor-pointer" 
                        data-filter="cat:${cat}">
                    ${cat}
                </button>
            `;
        });

        filterContainer.innerHTML = html;

        filterContainer.querySelectorAll(".filter-chip").forEach(btn => {
            btn.addEventListener("click", function () {
                filterContainer.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentFilter = this.getAttribute("data-filter");
                visibleCount = PAGE_SIZE;
                if (window.Analytics) {
                    window.Analytics.trackFilterSelect(currentFilter);
                }
                applyFiltersAndRender();
            });
        });
    }

    // 5. Aplicar filtros y búsqueda
    function applyFiltersAndRender() {
        if (!videoGrid) return;

        let filtered = allVideos.filter(v => {
            // Filtro por formato o categoría
            if (currentFilter === "format_short" && v.type !== "short") return false;
            if (currentFilter === "format_long" && v.type !== "documental") return false;
            if (currentFilter.startsWith("cat:") && v.category !== currentFilter.replace("cat:", "")) return false;

            // Filtro por texto
            if (currentSearch.trim()) {
                const q = currentSearch.toLowerCase();
                const inTitle = v.title.toLowerCase().includes(q);
                const inDesc = (v.description || "").toLowerCase().includes(q);
                const inTags = (v.tags || []).some(t => t.toLowerCase().includes(q));
                const inCat = (v.category || "").toLowerCase().includes(q);
                if (!inTitle && !inDesc && !inTags && !inCat) return false;
            }

            return true;
        });

        if (videoCountLabel) {
            videoCountLabel.textContent = `Mostrando ${Math.min(visibleCount, filtered.length)} de ${filtered.length} videos`;
        }

        const toShow = filtered.slice(0, visibleCount);

        if (toShow.length === 0) {
            videoGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400">
                    <p class="text-xl font-cinzel">No se encontraron videos con ese criterio.</p>
                    <p class="text-sm mt-2 text-slate-500">Prueba con otra palabra clave como "Marco Aurelio", "Mente", "Desierto" o "Salomón".</p>
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

    // 6. Generador de Tarjeta HTML
    function createVideoCardHTML(v) {
        const isShort = v.type === "short";
        const formatBadge = isShort ? "Short 9:16" : "Documental 16:9";
        const badgeColor = isShort ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-sky-500/20 text-sky-300 border-sky-500/30";

        return `
            <div class="glass-panel gold-border-glow rounded-2xl overflow-hidden flex flex-col group transition-all duration-300">
                <div class="relative overflow-hidden ${isShort ? 'aspect-[9/14]' : 'aspect-video'} bg-slate-950">
                    <img src="${v.thumbnail_url}" alt="${v.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='assets/banner.jpg'" />
                    <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <button onclick="window.openVideoModal('${v.youtube_id}', '${v.title.replace(/'/g, "\\'")}', '${v.format}')" 
                                class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform cursor-pointer">
                            <svg class="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                    <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor} backdrop-blur-md">
                        ${formatBadge}
                    </span>
                    <span class="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-mono bg-black/80 text-slate-200">
                        ${v.duration_formatted}
                    </span>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <span class="text-[11px] font-semibold text-amber-400 tracking-wider uppercase mb-1 block">
                            ${v.category}
                        </span>
                        <h4 class="text-base md:text-lg font-bold text-white mb-2 leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                            ${v.title}
                        </h4>
                        <p class="text-slate-400 text-xs line-clamp-2 mb-4 font-light leading-relaxed">
                            ${v.description || "Descubre la enseñanza histórica detrás de esta batalla interior."}
                        </p>
                    </div>
                    <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-slate-500">${v.created_at}</span>
                        <a href="${v.youtube_url}" target="_blank" rel="noopener noreferrer" 
                           onclick="window.Analytics && window.Analytics.trackYouTubeClick('${v.youtube_id}', '${v.title.replace(/'/g, "\\'")}', '${v.format}')"
                           class="text-amber-400 font-semibold hover:text-amber-300 flex items-center gap-1 group/link">
                            <span>YouTube</span>
                            <svg class="w-3.5 h-3.5 fill-current transform group-hover/link:translate-x-0.5 transition-transform" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // 7. Búsqueda con debounce
    if (searchInput) {
        let timer = null;
        searchInput.addEventListener("input", function (e) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentSearch = e.target.value;
                visibleCount = PAGE_SIZE;
                if (window.Analytics) {
                    window.Analytics.trackSearchQuery(currentSearch);
                }
                applyFiltersAndRender();
            }, 300);
        });
    }

    // 8. Botón Cargar Más
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", function () {
            visibleCount += PAGE_SIZE;
            applyFiltersAndRender();
        });
    }

    // 9. Manejador del Modal de Video
    window.openVideoModal = function (youtubeId, title, format) {
        if (!modal || !modalIframeContainer) return;

        if (window.Analytics) {
            window.Analytics.trackVideoModalOpen(youtubeId, title, format);
        }

        if (modalTitle) modalTitle.textContent = title;

        const ytUrl = (format === "9:16") 
            ? `https://www.youtube.com/shorts/${youtubeId}`
            : `https://www.youtube.com/watch?v=${youtubeId}`;

        if (modalYoutubeBtn) modalYoutubeBtn.href = ytUrl;

        // Iframe con modo privacidad de YouTube
        modalIframeContainer.innerHTML = `
            <iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1" 
                    title="${title}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    class="w-full h-full rounded-xl">
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

    // 10. Seguimiento de Descarga de Devocional Lead Magnet
    const devocionalBtn = document.getElementById("devocional-download-btn");
    if (devocionalBtn) {
        devocionalBtn.addEventListener("click", function () {
            if (window.Analytics) {
                window.Analytics.trackLeadDownload("Devocional_Digital_30_Dias.pdf");
            }
        });
    }

    // 11. Seguimiento de Suscripción en Header
    const subBtn = document.getElementById("header-subscribe-btn");
    if (subBtn) {
        subBtn.addEventListener("click", function () {
            if (window.Analytics) {
                window.Analytics.trackSubscribeClick("header_navbar");
            }
        });
    }
});
