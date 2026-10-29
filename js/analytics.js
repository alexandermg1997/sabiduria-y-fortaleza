/**
 * analytics.js - Módulo de Analítica Google Analytics 4 y Métricas de Conversión
 * 
 * Permite registrar visitas a la web y eventos clave de interacción que impulsan
 * el canal de YouTube (reproducciones, suscripciones, clics a YouTube y descargas).
 */

(function () {
    // 1. Inicializar Google Analytics si el ID está configurado
    const gaId = (window.SITE_CONFIG && window.SITE_CONFIG.gaMeasurementId) || (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.gaMeasurementId) || "G-4Z71Z1LH5V";

    if (gaId && !gaId.includes("EXAMPLE")) {
        // Inyectar gtag.js de forma asíncrona
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        gtag("js", new Date());
        gtag("config", gaId, {
            send_page_view: true,
            cookie_flags: "SameSite=None;Secure"
        });
        console.log(`[Google Analytics 4] Inicializado correctamente con ID: ${gaId}`);
    } else {
        // Modo simulación local para desarrollo seguro sin arrojar excepciones
        window.dataLayer = window.dataLayer || [];
        window.gtag = function (command, action, params) {
            console.log(`[GA4 Local Tracker] ${command} -> ${action}:`, params || {});
            window.dataLayer.push(arguments);
        };
        console.log("[Google Analytics 4] Modo simulación activo (configura tu ID real en js/config.js).");
    }
})();

// Funciones de seguimiento de eventos de conversión
const Analytics = {
    /**
     * Registra cuando un usuario hace clic para ver un video directamente en YouTube.
     */
    trackYouTubeClick: function (videoId, videoTitle, format) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "youtube_outbound_click", {
                video_id: videoId,
                video_title: videoTitle,
                video_format: format || "unknown",
                event_category: "Engagement",
                event_label: `YouTube Click: ${videoTitle}`
            });
        }
    },

    /**
     * Registra cuando se reproduce un video en el reproductor modal interno.
     */
    trackVideoModalOpen: function (videoId, videoTitle, format) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "video_modal_view", {
                video_id: videoId,
                video_title: videoTitle,
                video_format: format || "unknown",
                event_category: "Media",
                event_label: `Modal Play: ${videoTitle}`
            });
        }
    },

    /**
     * Registra cuando el usuario hace clic en el botón de suscripción a YouTube.
     */
    trackSubscribeClick: function (location) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "youtube_subscribe_click", {
                click_location: location || "header",
                event_category: "Conversion",
                event_label: "YouTube Subscribe CTA"
            });
        }
    },

    /**
     * Registra cuando el usuario descarga el Devocional Digital gratuito.
     */
    trackLeadDownload: function (resourceName) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "file_download", {
                file_name: resourceName || "Devocional_Digital_30_Dias.pdf",
                file_extension: "pdf",
                event_category: "Lead Magnet",
                event_label: "Devocional Download"
            });
        }
    },

    /**
     * Registra clics a comunidades externas (WhatsApp, Telegram, TikTok, etc.).
     */
    trackSocialCommunityClick: function (platformName) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "social_outbound_click", {
                social_platform: platformName,
                event_category: "Community",
                event_label: `Community Click: ${platformName}`
            });
        }
    },

    /**
     * Registra búsquedas de temáticas en la barra de búsqueda.
     */
    trackSearchQuery: function (query) {
        if (typeof window.gtag === "function" && query.length >= 3) {
            window.gtag("event", "search", {
                search_term: query,
                event_category: "Navigation"
            });
        }
    },

    /**
     * Registra el uso de filtros temáticos.
     */
    trackFilterSelect: function (categoryName) {
        if (typeof window.gtag === "function") {
            window.gtag("event", "select_content", {
                content_type: "category_filter",
                item_id: categoryName
            });
        }
    }
};

window.Analytics = Analytics;
