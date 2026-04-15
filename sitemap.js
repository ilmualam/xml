/**
 * IlmuAlam Sitemap - Advanced Blogger Sitemap with Islamic Emoji Mapping
 * 
 * @version 2.0.0
 * @author (IlmuAlam)
 * @license MIT
 * @repository https://github.com/ilmualam/sitemap
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // CONFIGURATION - Customize these values
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        // Blog Settings
        blogUrl: 'https://www.ilmualam.com',
        blogName: 'IlmuAlam',
        
        // Display Settings
        postsPerPage: 12,
        maxLabels: 20, // FIXED: Limit to 20 labels only
        imageSize: 300,
        excerptLength: 120,
        
        // Brand Colors
        primaryColor: '#249749', // Your brand green
        primaryHover: '#1e7d3d',
        primaryLight: '#e8f5ec',
        textDark: '#1a1a1a',
        textMuted: '#666666',
        
        // Fallback Image
        defaultThumb: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3E📷 Tiada Imej%3C/text%3E%3C/svg%3E',
        
        // Container IDs
        containerId: 'ilmualam-sitemap-posts',
        navContainerId: 'ilmualam-sitemap-nav',
        paginationContainerId: 'ilmualam-sitemap-pagination'
    };

    // ═══════════════════════════════════════════════════════════════════
    // ISLAMIC EMOJI MAPPING - Complete category emojis
    // ═══════════════════════════════════════════════════════════════════
    
    const EMOJI_MAP = {
        // Quran & Surah
        'quran': '📖',
        'al-quran': '📖',
        'surah': '📜',
        'surah pilihan': '📜',
        'ayat': '✨',
        'tafsir': '📚',
        'hafazan': '🎯',
        'tajwid': '🔊',
        'qiraat': '🎵',
        
        // Prayer & Worship
        'solat': '🕌',
        'sembahyang': '🕌',
        'doa': '🤲',
        'zikir': '📿',
        'wirid': '📿',
        'ibadah': '🙏',
        'taubat': '💚',
        'istighfar': '🌙',
        
        // Islamic Calendar & Events
        'ramadan': '🌙',
        'ramadhan': '🌙',
        'puasa': '🌅',
        'berbuka puasa': '🌅',
        'waktu berbuka': '🌅',
        'hari raya': '🎉',
        'aidilfitri': '🎉',
        'aidiladha': '🐑',
        'maulidur rasul': '🌟',
        'israk mikraj': '✨',
        'nisfu syaaban': '🌕',
        'muharam': '📅',
        
        // Zakat & Finance
        'zakat': '💰',
        'sedekah': '🤝',
        'wakaf': '🏛️',
        'faraid': '⚖️',
        'harta': '💎',
        
        // Hajj & Umrah
        'haji': '🕋',
        'umrah': '🕋',
        'tawaf': '🔄',
        'mekah': '🕋',
        'madinah': '🕌',
        
        // Islamic Knowledge
        'hadis': '📜',
        'hadith': '📜',
        'sunnah': '☀️',
        'fiqh': '⚖️',
        'akidah': '💎',
        'sirah': '📖',
        'kisah nabi': '👳',
        'kisah sahabat': '👥',
        'sejarah islam': '🏛️',
        
        // Family & Life
        'nikah': '💍',
        'perkahwinan': '💒',
        'keluarga': '👨‍👩‍👧‍👦',
        'anak': '👶',
        'ibu bapa': '👨‍👩‍👧',
        'pendidikan': '🎓',
        'akhlak': '💚',
        'adab': '🌹',
        
        // Death & Afterlife
        'kematian': '⚰️',
        'jenazah': '🤲',
        'kubur': '🪦',
        'akhirat': '🌌',
        'syurga': '🌈',
        'neraka': '🔥',
        
        // Tools & Calculators
        'kalkulator': '🧮',
        'waktu solat': '⏰',
        'arah kiblat': '🧭',
        'hijrah': '📅',
        'tarikh': '📆',
        
        // General Islamic
        'islam': '☪️',
        'muslim': '☪️',
        'allah': '﷽',
        'rasulullah': 'ﷺ',
        'nabi': '👳',
        'malaikat': '👼',
        'jin': '👻',
        'syaitan': '👿',
        
        // Health & Wellness
        'kesihatan': '🏥',
        'rawatan islam': '🌿',
        'ruqyah': '📿',
        'penawar': '💊',
        
        // Food
        'halal': '✅',
        'makanan': '🍽️',
        'resepi': '👨‍🍳',
        
        // Miscellaneous
        'tips': '💡',
        'panduan': '📋',
        'download': '⬇️',
        'video': '🎬',
        'audio': '🎧',
        'ebook': '📱',
        'aplikasi': '📲',
        
        // Default fallback
        'default': '📌'
    };

    // ═══════════════════════════════════════════════════════════════════
    // CACHE & STATE
    // ═══════════════════════════════════════════════════════════════════
    
    const cache = {
        labels: [],
        posts: {},
        allPosts: [],
        currentLabel: null,
        currentPage: 1,
        totalPosts: 0
    };

    // ═══════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get emoji for a label (case-insensitive matching)
     */
    function getEmoji(label) {
        const labelLower = label.toLowerCase().trim();
        
        // Direct match
        if (EMOJI_MAP[labelLower]) {
            return EMOJI_MAP[labelLower];
        }
        
        // Partial match
        for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
            if (labelLower.includes(key) || key.includes(labelLower)) {
                return emoji;
            }
        }
        
        return EMOJI_MAP['default'];
    }

    /**
     * Extract thumbnail from post
     */
    function getThumbnail(entry) {
        // Try media:thumbnail
        if (entry.media$thumbnail && entry.media$thumbnail.url) {
            return entry.media$thumbnail.url
                .replace(/\/s\d+(-c)?(-[a-z]+)?\//, `/s${CONFIG.imageSize}/`);
        }
        
        // Try content for YouTube thumbnails
        if (entry.content && entry.content.$t) {
            const content = entry.content.$t;
            
            // YouTube thumbnail
            const ytMatch = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (ytMatch) {
                return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
            }
            
            // First image in content
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) {
                return imgMatch[1]
                    .replace(/\/s\d+(-c)?(-[a-z]+)?\//, `/s${CONFIG.imageSize}/`);
            }
        }
        
        return CONFIG.defaultThumb;
    }

    /**
     * Create excerpt from content
     */
    function createExcerpt(entry) {
        let text = '';
        
        if (entry.summary && entry.summary.$t) {
            text = entry.summary.$t;
        } else if (entry.content && entry.content.$t) {
            text = entry.content.$t;
        }
        
        // Strip HTML and trim
        text = text.replace(/<[^>]+>/g, '').trim();
        
        if (text.length > CONFIG.excerptLength) {
            text = text.substring(0, CONFIG.excerptLength).trim() + '...';
        }
        
        return text;
    }

    /**
     * Format date
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('ms-MY', options);
    }

    /**
     * Get post URL
     */
    function getPostUrl(entry) {
        for (const link of entry.link) {
            if (link.rel === 'alternate') {
                return link.href;
            }
        }
        return '#';
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Show loading state
     */
    function showLoading() {
        const container = document.getElementById(CONFIG.containerId);
        if (container) {
            container.innerHTML = `
                <div class="ilmualam-loading">
                    <div class="ilmualam-spinner"></div>
                    <p>Memuatkan artikel...</p>
                </div>
            `;
        }
    }

    /**
     * Render label navigation
     */
    function renderLabels() {
        const navContainer = document.getElementById(CONFIG.navContainerId);
        if (!navContainer) return;

        // Sort by post count and limit to maxLabels
        const sortedLabels = cache.labels
            .sort((a, b) => b.count - a.count)
            .slice(0, CONFIG.maxLabels);

        let html = `
            <button class="ilmualam-label-btn ${!cache.currentLabel ? 'active' : ''}" 
                    onclick="IlmuAlamSitemap.loadAllPosts()">
                📚 Semua
            </button>
        `;

        sortedLabels.forEach(label => {
            const emoji = getEmoji(label.name);
            const isActive = cache.currentLabel === label.name ? 'active' : '';
            html += `
                <button class="ilmualam-label-btn ${isActive}" 
                        onclick="IlmuAlamSitemap.loadLabel('${label.name.replace(/'/g, "\\'")}')">
                    ${emoji} ${label.name}
                </button>
            `;
        });

        navContainer.innerHTML = html;
    }

    /**
     * Render posts grid
     */
    function renderPosts(posts) {
        const container = document.getElementById(CONFIG.containerId);
        if (!container) return;

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="ilmualam-no-posts">
                    <p>🔍 Tiada artikel dijumpai dalam kategori ini.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="ilmualam-grid">';

        posts.forEach(post => {
            const title = post.title.$t;
            const url = getPostUrl(post);
            const thumbnail = getThumbnail(post);
            const excerpt = createExcerpt(post);
            const date = formatDate(post.published.$t);

            html += `
                <article class="ilmualam-card">
                    <a href="${url}" class="ilmualam-card-image">
                        <img src="${thumbnail}" 
                             alt="${title}" 
                             loading="lazy"
                             onerror="this.src='${CONFIG.defaultThumb}'">
                    </a>
                    <div class="ilmualam-card-content">
                        <h3 class="ilmualam-card-title">
                            <a href="${url}">${title}</a>
                        </h3>
                        <p class="ilmualam-card-excerpt">${excerpt}</p>
                        <div class="ilmualam-card-meta">
                            <span class="ilmualam-card-date">📅 ${date}</span>
                            <a href="${url}" class="ilmualam-read-more">Baca Lagi →</a>
                        </div>
                    </div>
                </article>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render pagination
     */
    function renderPagination(totalPosts, currentPage) {
        const paginationContainer = document.getElementById(CONFIG.paginationContainerId);
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalPosts / CONFIG.postsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="ilmualam-pagination">';

        // Previous button
        if (currentPage > 1) {
            html += `
                <button class="ilmualam-page-btn" onclick="IlmuAlamSitemap.goToPage(${currentPage - 1})">
                    ← Sebelum
                </button>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button class="ilmualam-page-btn" onclick="IlmuAlamSitemap.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="ilmualam-page-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? 'active' : '';
            html += `
                <button class="ilmualam-page-btn ${isActive}" onclick="IlmuAlamSitemap.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="ilmualam-page-dots">...</span>`;
            }
            html += `<button class="ilmualam-page-btn" onclick="IlmuAlamSitemap.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            html += `
                <button class="ilmualam-page-btn" onclick="IlmuAlamSitemap.goToPage(${currentPage + 1})">
                    Seterusnya →
                </button>
            `;
        }

        html += '</div>';
        paginationContainer.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════════
    // DATA LOADING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Initialize sitemap - load labels
     */
    function init() {
        injectStyles();
        injectSchema();
        showLoading();
        
        // Load all posts to extract labels
        const script = document.createElement('script');
        script.src = `${CONFIG.blogUrl}/feeds/posts/summary?alt=json-in-script&max-results=500&callback=IlmuAlamSitemap.processLabels`;
        script.onerror = () => {
            console.error('Failed to load blog feed');
            const container = document.getElementById(CONFIG.containerId);
            if (container) {
                container.innerHTML = '<p class="ilmualam-error">Gagal memuatkan data. Sila cuba lagi.</p>';
            }
        };
        document.head.appendChild(script);
    }

    /**
     * Process labels from feed
     */
    function processLabels(data) {
        if (!data.feed || !data.feed.entry) {
            console.error('No entries in feed');
            return;
        }

        const entries = data.feed.entry;
        const labelMap = new Map();

        // Store all posts
        cache.allPosts = entries;

        // Extract labels with counts
        entries.forEach(entry => {
            if (entry.category) {
                entry.category.forEach(cat => {
                    const name = cat.term;
                    if (labelMap.has(name)) {
                        labelMap.get(name).count++;
                    } else {
                        labelMap.set(name, { name, count: 1 });
                    }
                });
            }
        });

        // Convert to array
        cache.labels = Array.from(labelMap.values());

        // Render labels and load all posts
        renderLabels();
        loadAllPosts();
    }

    /**
     * Load all posts
     */
    function loadAllPosts() {
        cache.currentLabel = null;
        cache.currentPage = 1;
        cache.totalPosts = cache.allPosts.length;

        renderLabels();
        displayPage(cache.allPosts, 1);
    }

    /**
     * Load posts by label
     */
    function loadLabel(labelName) {
        cache.currentLabel = labelName;
        cache.currentPage = 1;

        // Filter posts by label
        const filteredPosts = cache.allPosts.filter(post => {
            if (!post.category) return false;
            return post.category.some(cat => cat.term === labelName);
        });

        cache.posts[labelName] = filteredPosts;
        cache.totalPosts = filteredPosts.length;

        renderLabels();
        displayPage(filteredPosts, 1);
    }

    /**
     * Display specific page of posts
     */
    function displayPage(posts, page) {
        if (!Array.isArray(posts)) {
            posts = [];
        }

        const totalPages = Math.max(1, Math.ceil(posts.length / CONFIG.postsPerPage));
        const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);

        cache.currentPage = currentPage;
        
        const startIndex = (currentPage - 1) * CONFIG.postsPerPage;
        const endIndex = startIndex + CONFIG.postsPerPage;
        const pagePosts = posts.slice(startIndex, endIndex);

        renderPosts(pagePosts);
        renderPagination(posts.length, currentPage);

        // Scroll to top of container
        const container = document.getElementById(CONFIG.containerId);
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Go to specific page
     */
    function goToPage(page) {
        const posts = cache.currentLabel 
            ? cache.posts[cache.currentLabel] 
            : cache.allPosts;
        const totalPages = Math.max(1, Math.ceil(posts.length / CONFIG.postsPerPage));
        const pageNumber = Math.min(Math.max(1, Number(page) || 1), totalPages);

        if (pageNumber === cache.currentPage) {
            return;
        }

        displayPage(posts, pageNumber);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STYLE INJECTION
    // ═══════════════════════════════════════════════════════════════════
    
    function injectStyles() {
        if (document.getElementById('ilmualam-sitemap-styles')) return;

        const css = `
            /* IlmuAlam Sitemap Styles - Scoped */
            
            /* Reset for sitemap container */
            #ilmualam-sitemap-wrapper * {
                box-sizing: border-box;
            }
            
            /* Label Navigation */
            #${CONFIG.navContainerId} {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 24px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 12px;
            }
            
            .ilmualam-label-btn {
                padding: 8px 16px;
                border: 2px solid ${CONFIG.primaryColor};
                background: white;
                color: ${CONFIG.primaryColor};
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .ilmualam-label-btn:hover,
            .ilmualam-label-btn.active {
                background: ${CONFIG.primaryColor};
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(36, 151, 73, 0.3);
            }
            
            /* Posts Grid */
            .ilmualam-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 24px;
                margin-bottom: 32px;
            }
            
            /* Card Styles */
            .ilmualam-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
            }
            
            .ilmualam-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
            
            .ilmualam-card-image {
                display: block;
                position: relative;
                padding-top: 60%;
                overflow: hidden;
            }
            
            .ilmualam-card-image img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .ilmualam-card:hover .ilmualam-card-image img {
                transform: scale(1.05);
            }
            
            .ilmualam-card-content {
                padding: 16px;
            }
            
            .ilmualam-card-title {
                margin: 0 0 8px;
                font-size: 16px;
                line-height: 1.4;
            }
            
            .ilmualam-card-title a {
                color: ${CONFIG.textDark};
                text-decoration: none;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .ilmualam-card-title a:hover {
                color: ${CONFIG.primaryColor};
            }
            
            .ilmualam-card-excerpt {
                color: ${CONFIG.textMuted};
                font-size: 13px;
                line-height: 1.5;
                margin: 0 0 12px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .ilmualam-card-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
            }
            
            .ilmualam-card-date {
                color: ${CONFIG.textMuted};
            }
            
            /* READ MORE - Brand Color */
            .ilmualam-read-more {
                color: ${CONFIG.primaryColor} !important;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.2s ease;
            }
            
            .ilmualam-read-more:hover {
                color: ${CONFIG.primaryHover} !important;
                text-decoration: underline;
            }
            
            /* Pagination - Brand Color */
            .ilmualam-pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin: 32px 0;
            }
            
            .ilmualam-page-btn {
                padding: 10px 16px;
                border: 2px solid ${CONFIG.primaryColor};
                background: white;
                color: ${CONFIG.primaryColor};
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                min-width: 44px;
            }
            
            .ilmualam-page-btn:hover,
            .ilmualam-page-btn.active {
                background: ${CONFIG.primaryColor};
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(36, 151, 73, 0.3);
            }
            
            .ilmualam-page-dots {
                color: ${CONFIG.textMuted};
                padding: 0 8px;
            }
            
            /* Loading State */
            .ilmualam-loading {
                text-align: center;
                padding: 60px 20px;
            }
            
            .ilmualam-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid ${CONFIG.primaryColor};
                border-radius: 50%;
                margin: 0 auto 16px;
                animation: ilmualam-spin 0.8s linear infinite;
            }
            
            @keyframes ilmualam-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .ilmualam-no-posts,
            .ilmualam-error {
                text-align: center;
                padding: 40px 20px;
                color: ${CONFIG.textMuted};
                font-size: 16px;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .ilmualam-grid {
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                }
                
                #${CONFIG.navContainerId} {
                    gap: 6px;
                    padding: 12px;
                }
                
                .ilmualam-label-btn {
                    padding: 6px 12px;
                    font-size: 12px;
                }
                
                .ilmualam-page-btn {
                    padding: 8px 12px;
                    font-size: 12px;
                    min-width: 38px;
                }
            }
            
            @media (max-width: 480px) {
                .ilmualam-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = 'ilmualam-sitemap-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SCHEMA INJECTION - SEO
    // ═══════════════════════════════════════════════════════════════════
    
    function injectSchema() {
        if (document.getElementById('ilmualam-sitemap-schema')) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Sitemap - " + CONFIG.blogName,
            "description": "Arkib lengkap artikel Islam, panduan solat, bacaan Quran, dan ilmu agama dari " + CONFIG.blogName,
            "url": CONFIG.blogUrl + "/p/sitemap.html",
            "isPartOf": {
                "@type": "WebSite",
                "name": CONFIG.blogName,
                "url": CONFIG.blogUrl
            },
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Laman Utama",
                        "item": CONFIG.blogUrl
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Sitemap",
                        "item": CONFIG.blogUrl + "/p/sitemap.html"
                    }
                ]
            }
        };

        const script = document.createElement('script');
        script.id = 'ilmualam-sitemap-schema';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════
    
    window.IlmuAlamSitemap = {
        init: init,
        processLabels: processLabels,
        loadAllPosts: loadAllPosts,
        loadLabel: loadLabel,
        goToPage: goToPage,
        
        // Expose config for customization
        config: CONFIG,
        
        // Expose emoji map for additions
        emojiMap: EMOJI_MAP
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
