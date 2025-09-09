// Recipe Blog Frontend JavaScript - Enhanced Version
class RecipeBlog {
    constructor() {
        this.siteConfig = null;
        this.recipes = [];
        this.categories = [];
        this.authors = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchTerm = '';
        this.currentFilter = { type: null, value: null };
        this.sortBy = 'newest';
        this.viewMode = 'grid';
        this.activeFilters = {};
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.showLoading();
        try {
            await this.loadData();
            this.setupEventListeners();
            this.routePage();
            this.setupBackToTop();
            this.setupMobileMenu();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load application data');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
        this.isLoading = true;
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) {
            setTimeout(() => {
                loadingEl.style.display = 'none';
            }, 500); // Small delay for better UX
        }
        this.isLoading = false;
    }

    async loadData() {
        try {
            const [siteConfig, recipes, categories, authors] = await Promise.all([
                this.fetchJSON('data/site_config.json'),
                this.fetchJSON('data/recipes.json'),
                this.fetchJSON('data/categories.json'),
                this.fetchJSON('data/authors.json')
            ]);

            this.siteConfig = siteConfig;
            this.recipes = recipes.filter(recipe => recipe.published);
            this.categories = categories;
            this.authors = authors;
            this.itemsPerPage = siteConfig.itemsPerPage || 12;

            this.updateSiteInfo();
        } catch (error) {
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }

    async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    updateSiteInfo() {
        const elements = {
            'site-name': this.siteConfig.siteName,
            'site-logo': this.siteConfig.logo,
            'hero-site-name': this.siteConfig.siteName,
            'footer-site-name': this.siteConfig.siteName,
            'footer-copyright': this.siteConfig.siteName
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id.includes('logo')) {
                    element.src = value;
                    element.alt = this.siteConfig.siteName + ' Logo';
                } else {
                    element.textContent = value;
                }
            }
        });

        // Update document title if it's the default
        if (document.title === 'My Recipe Blog' || document.title === 'Recipe Details') {
            document.title = this.siteConfig.siteName;
        }

        // Update footer categories
        this.updateFooterCategories();
    }

    updateFooterCategories() {
        const footerCategoriesEl = document.getElementById('footer-categories');
        if (footerCategoriesEl) {
            footerCategoriesEl.innerHTML = this.categories.map(category => 
                `<li><a href="/category.html?slug=${category.slug}">${category.title}</a></li>`
            ).join('');
        }
    }

    setupEventListeners() {
        // Search functionality
        this.setupSearch();
        
        // Sort and filter controls
        this.setupSortFilter();
        
        // View toggle
        this.setupViewToggle();
        
        // Clear filters
        this.setupClearFilters();
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput && searchBtn) {
            const performSearch = () => {
                this.searchTerm = searchInput.value.trim();
                this.currentPage = 1;
                this.renderRecipes();
                this.updateURL();
            };

            searchBtn.addEventListener('click', performSearch);
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Live search with debounce
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = searchInput.value.trim();
                    this.currentPage = 1;
                    this.renderRecipes();
                    this.updateURL();
                }, 300);
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.searchTerm = '';
                this.currentPage = 1;
                this.renderRecipes();
                this.updateURL();
            });
        }
    }

    setupSortFilter() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortBy = sortSelect.value;
                this.currentPage = 1;
                this.renderRecipes();
                this.updateURL();
            });
        }

        const difficultyFilter = document.getElementById('difficulty-filter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => {
                this.activeFilters.difficulty = difficultyFilter.value;
                this.currentPage = 1;
                this.renderRecipes();
                this.updateActiveFilters();
                this.updateURL();
            });
        }
    }

    setupViewToggle() {
        const gridViewBtn = document.getElementById('grid-view');
        const listViewBtn = document.getElementById('list-view');
        const recipesGrid = document.getElementById('recipes-grid');

        if (gridViewBtn && listViewBtn && recipesGrid) {
            gridViewBtn.addEventListener('click', () => {
                this.viewMode = 'grid';
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
                recipesGrid.classList.remove('list-view');
                recipesGrid.classList.add('grid-view');
            });

            listViewBtn.addEventListener('click', () => {
                this.viewMode = 'list';
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
                recipesGrid.classList.add('list-view');
                recipesGrid.classList.remove('grid-view');
            });
        }
    }

    setupClearFilters() {
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.activeFilters = {};
                this.searchTerm = '';
                this.currentPage = 1;
                
                // Reset form controls
                const searchInput = document.getElementById('search-input');
                const difficultyFilter = document.getElementById('difficulty-filter');
                const sortSelect = document.getElementById('sort-select');
                
                if (searchInput) searchInput.value = '';
                if (difficultyFilter) difficultyFilter.value = '';
                if (sortSelect) sortSelect.value = 'newest';
                
                this.renderRecipes();
                this.updateActiveFilters();
                this.updateURL();
            });
        }
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.style.display = 'block';
                } else {
                    backToTopBtn.style.display = 'none';
                }
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }
    }

    routePage() {
        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
    
        // Load URL parameters
        this.loadURLParams(urlParams);
    
        // Détection améliorée pour la page d'accueil
        if (path === '/' || 
            path === '/index.html' || 
            path.includes('/public/') || 
            path.endsWith('/public')) {
            this.renderHomePage();
        } else if (path === '/recipe.html' || path.includes('recipe.html')) {
            const slug = urlParams.get('slug');
            this.renderRecipePage(slug);
        } else if (path === '/category.html' || path.includes('category.html')) {
            const slug = urlParams.get('slug');
            this.renderCategoryPage(slug);
        } else if (path === '/author.html' || path.includes('author.html')) {
            const slug = urlParams.get('slug');
            this.renderAuthorPage(slug);
        } else {
            this.renderHomePage(); // Fallback vers la page d'accueil
        }
    }

    loadURLParams(urlParams) {
        // Load search and filter parameters from URL
        this.searchTerm = urlParams.get('search') || '';
        this.sortBy = urlParams.get('sort') || 'newest';
        this.currentPage = parseInt(urlParams.get('page')) || 1;
        this.viewMode = urlParams.get('view') || 'grid';
        
        if (urlParams.get('difficulty')) {
            this.activeFilters.difficulty = urlParams.get('difficulty');
        }

        // Update form controls with URL parameters
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        const difficultyFilter = document.getElementById('difficulty-filter');
        
        if (searchInput) searchInput.value = this.searchTerm;
        if (sortSelect) sortSelect.value = this.sortBy;
        if (difficultyFilter && this.activeFilters.difficulty) {
            difficultyFilter.value = this.activeFilters.difficulty;
        }
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.searchTerm) params.set('search', this.searchTerm);
        if (this.sortBy !== 'newest') params.set('sort', this.sortBy);
        if (this.currentPage > 1) params.set('page', this.currentPage);
        if (this.viewMode !== 'grid') params.set('view', this.viewMode);
        if (this.activeFilters.difficulty) params.set('difficulty', this.activeFilters.difficulty);
        
        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newURL);
    }

    renderHomePage() {
        // Update stats
        this.updateElement('recipe-count', this.recipes.length);
        this.updateElement('category-count', this.categories.length);
        this.updateElement('author-count', this.authors.length);

        // Render sections
        this.renderRecipes();
        this.renderCategories();
        this.renderAuthors();
    }

    renderRecipePage(slug) {
        const recipe = this.recipes.find(r => r.slug === slug);
        if (!recipe) {
            this.showNotFound();
            return;
        }

        // Update SEO
        this.updateSEO(recipe.seo.title, recipe.seo.description, recipe.image);
        this.updateStructuredData('recipe', recipe);

        // Get category and author info
        const category = this.categories.find(c => c.id === recipe.categoryId);
        const author = this.authors.find(a => a.id === recipe.authorId);

        const recipeHtml = `
            <div class="recipe-header">
                <div class="breadcrumb">
                    <ol>
                        <li><a href="">Home</a></li>
                        <li><a href="category.html?slug=${category?.slug || ''}">${category?.title || 'Category'}</a></li>
                        <li aria-current="page">${recipe.title}</li>
                    </ol>
                </div>
                <h1>${recipe.title}</h1>
                <div class="recipe-meta">
                    <span class="recipe-author">
                        By <a href="author.html?slug=${author?.slug || ''}">${author?.name || 'Unknown'}</a>
                    </span>
                    <span class="recipe-date">
                        <time datetime="${recipe.createdAt}">${this.formatDate(recipe.createdAt)}</time>
                    </span>
                    <span class="recipe-category">
                        <a href="category.html?slug=${category?.slug || ''}">${category?.title || 'Uncategorized'}</a>
                    </span>
                </div>
                <p class="recipe-excerpt">${recipe.excerpt}</p>
            </div>

            <div class="recipe-content">
                <div class="recipe-image-section">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy" class="recipe-main-image">
                    <div class="recipe-actions">
                        <button class="action-btn save-recipe" title="Save Recipe">💾</button>
                        <button class="action-btn share-recipe" title="Share Recipe">🔗</button>
                        <button class="action-btn print-recipe" title="Print Recipe">🖨️</button>
                    </div>
                </div>

                <div class="recipe-details">
                    <div class="recipe-section ingredients-section">
                        <h2>Ingredients</h2>
                        <ul class="ingredients-list">
                            ${recipe.ingredients.map((ingredient, index) => 
                                `<li>
                                    <label class="ingredient-item">
                                        <input type="checkbox" class="ingredient-checkbox" data-index="${index}">
                                        <span class="ingredient-text">${ingredient}</span>
                                    </label>
                                </li>`
                            ).join('')}
                        </ul>
                        <div class="ingredients-actions">
                            <button class="btn btn-secondary" id="toggle-all-ingredients">Check All</button>
                        </div>
                    </div>

                    <div class="recipe-section instructions-section">
                        <h2>Instructions</h2>
                        <ol class="steps-list">
                            ${recipe.steps.map((step, index) => 
                                `<li class="step-item" data-step="${index + 1}">
                                    <div class="step-content">${step}</div>
                                    <button class="step-done" title="Mark as done">✓</button>
                                </li>`
                            ).join('')}
                        </ol>
                    </div>

                    ${recipe.tags.length > 0 ? `
                        <div class="recipe-section tags-section">
                            <h3>Tags</h3>
                            <div class="recipe-tags">
                                ${recipe.tags.map(tag => 
                                    `<a href="/?search=${encodeURIComponent(tag)}" class="tag">${tag}</a>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="recipe-section nutrition-section">
                        <h3>Recipe Information</h3>
                        <div class="recipe-info-grid">
                            <div class="info-item">
                                <strong>Servings</strong>
                                <span>4-6 people</span>
                            </div>
                            <div class="info-item">
                                <strong>Prep Time</strong>
                                <span>30 minutes</span>
                            </div>
                            <div class="info-item">
                                <strong>Cook Time</strong>
                                <span>1 hour</span>
                            </div>
                            <div class="info-item">
                                <strong>Difficulty</strong>
                                <span>Medium</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateElement('recipe-detail', recipeHtml);

        // Setup recipe interactions
        this.setupRecipeInteractions();

        // Render related recipes
        this.renderRelatedRecipes(recipe);
    }

    setupRecipeInteractions() {
        // Ingredient checkboxes
        const toggleAllBtn = document.getElementById('toggle-all-ingredients');
        const checkboxes = document.querySelectorAll('.ingredient-checkbox');
        
        if (toggleAllBtn && checkboxes.length) {
            let allChecked = false;
            
            toggleAllBtn.addEventListener('click', () => {
                allChecked = !allChecked;
                checkboxes.forEach(checkbox => {
                    checkbox.checked = allChecked;
                    checkbox.closest('.ingredient-item').classList.toggle('checked', allChecked);
                });
                toggleAllBtn.textContent = allChecked ? 'Uncheck All' : 'Check All';
            });

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    checkbox.closest('.ingredient-item').classList.toggle('checked', checkbox.checked);
                });
            });
        }

        // Step completion
        const stepDoneButtons = document.querySelectorAll('.step-done');
        stepDoneButtons.forEach(button => {
            button.addEventListener('click', () => {
                const stepItem = button.closest('.step-item');
                stepItem.classList.toggle('completed');
                button.textContent = stepItem.classList.contains('completed') ? '↻' : '✓';
            });
        });

        // Recipe actions
        this.setupRecipeActions();
    }

    setupRecipeActions() {
        const saveBtn = document.querySelector('.save-recipe');
        const shareBtn = document.querySelector('.share-recipe');
        const printBtn = document.querySelector('.print-recipe');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Save to localStorage or show save dialog
                this.showToast('Recipe saved to your collection!');
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: document.title,
                            text: document.querySelector('meta[name="description"]').content,
                            url: window.location.href
                        });
                    } catch (error) {
                        this.copyToClipboard(window.location.href);
                    }
                } else {
                    this.copyToClipboard(window.location.href);
                }
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    renderCategoryPage(slug) {
        const category = this.categories.find(c => c.slug === slug);
        if (!category) {
            this.showNotFound();
            return;
        }

        // Update page info
        this.updateElement('category-title', category.title);
        this.updateElement('category-description', category.description);
        this.updateElement('category-name-recipes', category.title);
        this.updateElement('category-name-tags', category.title);
        this.updateElement('category-name-authors', category.title);
        this.updateElement('current-category-breadcrumb', category.title);

        // Update statistics
        const categoryRecipes = this.recipes.filter(r => r.categoryId === category.id);
        const categoryAuthors = [...new Set(categoryRecipes.map(r => r.authorId))];
        
        this.updateElement('category-recipe-count', categoryRecipes.length);
        this.updateElement('category-authors-count', categoryAuthors.length);

        // Filter recipes by category
        this.currentFilter = { type: 'category', value: category.id };
        this.renderRecipes();

        // Render category-specific content
        this.renderCategoryNavigation(category);
        this.renderCategoryTags(category);
        this.renderCategoryAuthors(categoryAuthors);
        this.renderRelatedCategories(category);

        // Update SEO
        this.updateSEO(
            `${category.title} Recipes | ${this.siteConfig.siteName}`,
            category.description || `Browse all ${category.title.toLowerCase()} recipes`,
            categoryRecipes[0]?.image
        );
        this.updateStructuredData('category', category);
    }

    renderAuthorPage(slug) {
        const author = this.authors.find(a => a.slug === slug);
        if (!author) {
            this.showNotFound();
            return;
        }

        // Update author info
        this.updateElement('author-name', author.name);
        this.updateElement('author-name-recipes', author.name);
        this.updateElement('author-bio', author.bio);
        this.updateElement('current-author-breadcrumb', author.name);
        
        const avatarEl = document.getElementById('author-avatar');
        if (avatarEl) {
            avatarEl.src = author.avatar;
            avatarEl.alt = `${author.name} - Author Photo`;
        }

        // Update statistics
        const authorRecipes = this.recipes.filter(r => r.authorId === author.id);
        const authorCategories = [...new Set(authorRecipes.map(r => r.categoryId))];
        
        this.updateElement('author-recipe-count', authorRecipes.length);
        this.updateElement('author-categories-count', authorCategories.length);

        // Filter recipes by author
        this.currentFilter = { type: 'author', value: author.id };
        this.renderRecipes();

        // Render related authors
        this.renderRelatedAuthors(author);

        // Update SEO
        this.updateSEO(
            `Recipes by ${author.name} | ${this.siteConfig.siteName}`,
            author.bio || `Browse all recipes by ${author.name}`,
            author.avatar
        );
        this.updateStructuredData('author', author);
    }

    renderRecipes() {
        let filteredRecipes = [...this.recipes];

        // Apply search filter
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.title.toLowerCase().includes(searchLower) ||
                recipe.excerpt.toLowerCase().includes(searchLower) ||
                recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchLower)) ||
                recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        // Apply category/author filter
        if (this.currentFilter.type === 'category') {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.categoryId === this.currentFilter.value);
        } else if (this.currentFilter.type === 'author') {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.authorId === this.currentFilter.value);
        }

        // Apply additional filters
        if (this.activeFilters.difficulty) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.difficulty === this.activeFilters.difficulty
            );
        }

        // Sort recipes
        filteredRecipes = this.sortRecipes(filteredRecipes);

        // Show/hide no results message
        const noRecipesEl = document.getElementById('no-recipes');
        if (filteredRecipes.length === 0) {
            if (noRecipesEl) noRecipesEl.style.display = 'block';
            this.updateElement('recipes-grid', '');
            this.updateElement('pagination', '');
            return;
        } else {
            if (noRecipesEl) noRecipesEl.style.display = 'none';
        }

        // Pagination
        const totalPages = Math.ceil(filteredRecipes.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + this.itemsPerPage);

        // Render recipe cards
        const recipesHtml = paginatedRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        this.updateElement('recipes-grid', recipesHtml);

        // Render pagination
        this.renderPagination(totalPages);

        // Update active filters display
        this.updateActiveFilters();
    }

    sortRecipes(recipes) {
        switch (this.sortBy) {
            case 'oldest':
                return recipes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'alphabetical':
                return recipes.sort((a, b) => a.title.localeCompare(b.title));
            case 'category':
                return recipes.sort((a, b) => {
                    const catA = this.categories.find(c => c.id === a.categoryId)?.title || '';
                    const catB = this.categories.find(c => c.id === b.categoryId)?.title || '';
                    return catA.localeCompare(catB);
                });
            case 'popular':
                // For demo purposes, sort by title length as popularity proxy
                return recipes.sort((a, b) => b.title.length - a.title.length);
            case 'newest':
            default:
                return recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    createRecipeCard(recipe) {
        const category = this.categories.find(c => c.id === recipe.categoryId);
        const author = this.authors.find(a => a.id === recipe.authorId);

        return `
            <article class="recipe-card" data-recipe-id="${recipe.id}">
                <a href="/recipe.html?slug=${recipe.slug}" class="recipe-link">
                    <div class="recipe-image">
                        <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                        ${category ? `<span class="recipe-category-tag">${category.title}</span>` : ''}
                        <div class="recipe-overlay">
                            <span class="recipe-read-time">🕒 15 min read</span>
                        </div>
                    </div>
                    <div class="recipe-info">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <p class="recipe-excerpt">${recipe.excerpt}</p>
                        <div class="recipe-meta">
                            <span class="recipe-author">
                                <img src="${author?.avatar || '/assets/images/default-avatar.jpg'}" alt="${author?.name || 'Unknown'}" class="author-mini-avatar">
                                ${author?.name || 'Unknown'}
                            </span>
                            <span class="recipe-date">
                                <time datetime="${recipe.createdAt}">${this.formatDate(recipe.createdAt)}</time>
                            </span>
                        </div>
                        ${recipe.tags.length > 0 ? `
                            <div class="recipe-tags-mini">
                                ${recipe.tags.slice(0, 3).map(tag => `<span class="tag-mini">${tag}</span>`).join('')}
                                ${recipe.tags.length > 3 ? '<span class="tag-mini">+' + (recipe.tags.length - 3) + '</span>' : ''}
                            </div>
                        ` : ''}
                    </div>
                </a>
                <div class="recipe-actions">
                    <button class="recipe-action-btn save-btn" title="Save Recipe" data-recipe-id="${recipe.id}">💾</button>
                    <button class="recipe-action-btn share-btn" title="Share Recipe" data-recipe-slug="${recipe.slug}">🔗</button>
                </div>
            </article>
        `;
    }

    renderCategories() {
        const categoriesHtml = this.categories.map(category => {
            const recipeCount = this.recipes.filter(r => r.categoryId === category.id).length;
            const featuredRecipe = this.recipes.find(r => r.categoryId === category.id);
            
            return `
                <div class="category-card" data-category-id="${category.id}">
                    <a href="/category.html?slug=${category.slug}" class="category-link">
                        <div class="category-image">
                            ${featuredRecipe ? 
                                `<img src="${featuredRecipe.image}" alt="${category.title}" loading="lazy">` :
                                `<div class="category-placeholder">🍽️</div>`
                            }
                            <div class="category-overlay">
                                <span class="recipe-count-badge">${recipeCount} recipes</span>
                            </div>
                        </div>
                        <div class="category-info">
                            <h3>${category.title}</h3>
                            <p>${category.description}</p>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        this.updateElement('categories-grid', categoriesHtml);
    }

    renderAuthors() {
        const authorsHtml = this.authors.map(author => {
            const recipeCount = this.recipes.filter(r => r.authorId === author.id).length;
            
            return `
                <div class="author-card" data-author-id="${author.id}">
                    <a href="/author.html?slug=${author.slug}" class="author-link">
                        <img src="${author.avatar}" alt="${author.name}" class="author-avatar" loading="lazy">
                        <div class="author-info">
                            <h3>${author.name}</h3>
                            <p>${this.truncateText(author.bio, 100)}</p>
                            <span class="recipe-count">${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}</span>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        this.updateElement('authors-grid', authorsHtml);
    }

    renderCategoryNavigation(currentCategory) {
        const categoryPillsEl = document.getElementById('category-nav-pills');
        if (categoryPillsEl) {
            const pillsHtml = this.categories.map(category => 
                `<a href="/category.html?slug=${category.slug}" 
                   class="category-pill ${category.id === currentCategory.id ? 'active' : ''}">${category.title}</a>`
            ).join('');
            categoryPillsEl.innerHTML = pillsHtml;
        }
    }

    renderCategoryTags(category) {
        const tagsCloudEl = document.getElementById('tags-cloud');
        if (tagsCloudEl) {
            const categoryRecipes = this.recipes.filter(r => r.categoryId === category.id);
            const allTags = categoryRecipes.flatMap(recipe => recipe.tags);
            const tagCounts = {};
            
            allTags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });

            const sortedTags = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15);

            const tagsHtml = sortedTags.map(([tag, count]) => {
                const size = count > 2 ? 'large' : '';
                return `<a href="/category.html?slug=${category.slug}&search=${encodeURIComponent(tag)}" 
                           class="tag-cloud-item ${size}" 
                           title="${count} recipes">${tag}</a>`;
            }).join('');

            tagsCloudEl.innerHTML = tagsHtml;
        }
    }

    renderCategoryAuthors(authorIds) {
        const categoryAuthorsEl = document.getElementById('category-authors-grid');
        if (categoryAuthorsEl) {
            const categoryAuthors = this.authors.filter(author => authorIds.includes(author.id));
            const authorsHtml = categoryAuthors.map(author => {
                const recipeCount = this.recipes.filter(r => 
                    r.authorId === author.id && 
                    r.categoryId === this.currentFilter.value
                ).length;

                return `
                    <div class="author-card featured-author">
                        <a href="/author.html?slug=${author.slug}">
                            <img src="${author.avatar}" alt="${author.name}" class="author-avatar">
                            <h4>${author.name}</h4>
                            <p>${this.truncateText(author.bio, 80)}</p>
                            <span class="recipe-count">${recipeCount} recipes in this category</span>
                        </a>
                    </div>
                `;
            }).join('');

            categoryAuthorsEl.innerHTML = authorsHtml;
        }
    }

    renderRelatedCategories(currentCategory) {
        const relatedCategoriesEl = document.getElementById('related-categories-grid');
        if (relatedCategoriesEl) {
            const relatedCategories = this.categories
                .filter(cat => cat.id !== currentCategory.id)
                .slice(0, 3);

            const categoriesHtml = relatedCategories.map(category => {
                const recipeCount = this.recipes.filter(r => r.categoryId === category.id).length;
                const featuredRecipe = this.recipes.find(r => r.categoryId === category.id);
                
                return `
                    <div class="category-card">
                        <a href="/category.html?slug=${category.slug}">
                            <div class="category-image">
                                ${featuredRecipe ? 
                                    `<img src="${featuredRecipe.image}" alt="${category.title}" loading="lazy">` :
                                    `<div class="category-placeholder">🍽️</div>`
                                }
                            </div>
                            <h4>${category.title}</h4>
                            <p>${this.truncateText(category.description, 60)}</p>
                            <span class="recipe-count">${recipeCount} recipes</span>
                        </a>
                    </div>
                `;
            }).join('');

            relatedCategoriesEl.innerHTML = categoriesHtml;
        }
    }

    renderRelatedAuthors(currentAuthor) {
        const relatedAuthorsEl = document.getElementById('related-authors-grid');
        if (relatedAuthorsEl) {
            const relatedAuthors = this.authors
                .filter(author => author.id !== currentAuthor.id)
                .slice(0, 3);

            const authorsHtml = relatedAuthors.map(author => {
                const recipeCount = this.recipes.filter(r => r.authorId === author.id).length;
                
                return `
                    <div class="author-card">
                        <a href="/author.html?slug=${author.slug}">
                            <img src="${author.avatar}" alt="${author.name}" class="author-avatar">
                            <h4>${author.name}</h4>
                            <p>${this.truncateText(author.bio, 80)}</p>
                            <span class="recipe-count">${recipeCount} recipes</span>
                        </a>
                    </div>
                `;
            }).join('');

            relatedAuthorsEl.innerHTML = authorsHtml;
        }
    }

    renderRelatedRecipes(currentRecipe) {
        // Find recipes with similar tags or same category
        let relatedRecipes = this.recipes.filter(recipe => 
            recipe.id !== currentRecipe.id && (
                recipe.categoryId === currentRecipe.categoryId ||
                recipe.tags.some(tag => currentRecipe.tags.includes(tag))
            )
        ).slice(0, 3);

        if (relatedRecipes.length === 0) {
            // Fallback to latest recipes
            relatedRecipes = this.recipes
                .filter(recipe => recipe.id !== currentRecipe.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);
        }

        const relatedHtml = relatedRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        this.updateElement('related-recipes-grid', relatedHtml);
    }

    renderPagination(totalPages) {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl || totalPages <= 1) {
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        let paginationHtml = '<div class="pagination-container">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHtml += `<button class="pagination-btn prev-btn" data-page="${this.currentPage - 1}" aria-label="Previous page">← Previous</button>`;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="pagination-dots">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHtml += `<button class="pagination-btn next-btn" data-page="${this.currentPage + 1}" aria-label="Next page">Next →</button>`;
        }

        paginationHtml += '</div>';
        paginationEl.innerHTML = paginationHtml;

        // Add event listeners to pagination buttons
        paginationEl.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPage = parseInt(btn.dataset.page);
                this.renderRecipes();
                this.updateURL();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    updateActiveFilters() {
        const activeFiltersEl = document.getElementById('active-filters');
        const activeFilterTagsEl = document.getElementById('active-filter-tags');
        
        if (activeFiltersEl && activeFilterTagsEl) {
            const hasActiveFilters = this.searchTerm || Object.keys(this.activeFilters).length > 0;
            
            if (hasActiveFilters) {
                let tagsHtml = '';
                
                if (this.searchTerm) {
                    tagsHtml += `<span class="filter-tag">
                        Search: "${this.searchTerm}"
                        <span class="remove" onclick="RecipeBlogApp.clearSearchTerm()">×</span>
                    </span>`;
                }
                
                Object.entries(this.activeFilters).forEach(([key, value]) => {
                    if (value) {
                        tagsHtml += `<span class="filter-tag">
                            ${key}: ${value}
                            <span class="remove" onclick="RecipeBlogApp.removeFilter('${key}')">×</span>
                        </span>`;
                    }
                });
                
                activeFilterTagsEl.innerHTML = tagsHtml;
                activeFiltersEl.style.display = 'flex';
            } else {
                activeFiltersEl.style.display = 'none';
            }
        }
    }

    clearSearchTerm() {
        this.searchTerm = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        this.currentPage = 1;
        this.renderRecipes();
        this.updateURL();
    }

    removeFilter(filterKey) {
        delete this.activeFilters[filterKey];
        
        // Update form controls
        if (filterKey === 'difficulty') {
            const difficultyFilter = document.getElementById('difficulty-filter');
            if (difficultyFilter) difficultyFilter.value = '';
        }
        
        this.currentPage = 1;
        this.renderRecipes();
        this.updateURL();
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    }

    updateSEO(title, description, image = null) {
        // Update document title
        document.title = title;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = description;
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        
        if (ogTitle) ogTitle.content = title;
        if (ogDesc) ogDesc.content = description;
        if (ogUrl) ogUrl.content = window.location.href;
        
        if (image && ogImage) {
            ogImage.content = image.startsWith('http') ? image : window.location.origin + image;
        }

        // Update Twitter Card tags
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        
        if (twitterTitle) twitterTitle.content = title;
        if (twitterDesc) twitterDesc.content = description;
        if (image && twitterImage) {
            twitterImage.content = image.startsWith('http') ? image : window.location.origin + image;
        }

        // Update canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = window.location.href;
        }
    }

    updateStructuredData(type, data) {
        const structuredDataEl = document.getElementById(`${type}-structured-data`);
        if (!structuredDataEl) return;

        let structuredData = {};

        switch (type) {
            case 'recipe':
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Recipe",
                    "name": data.title,
                    "description": data.excerpt,
                    "image": data.image,
                    "author": {
                        "@type": "Person",
                        "name": this.authors.find(a => a.id === data.authorId)?.name || "Unknown"
                    },
                    "datePublished": data.createdAt,
                    "recipeCategory": this.categories.find(c => c.id === data.categoryId)?.title || "Recipe",
                    "keywords": data.tags.join(", "),
                    "recipeIngredient": data.ingredients,
                    "recipeInstructions": data.steps.map((step, index) => ({
                        "@type": "HowToStep",
                        "text": step,
                        "position": index + 1
                    }))
                };
                break;

            case 'author':
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": data.name,
                    "description": data.bio,
                    "image": data.avatar,
                    "url": window.location.href
                };
                break;

            case 'category':
                const categoryRecipes = this.recipes.filter(r => r.categoryId === data.id);
                structuredData = {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": data.title,
                    "description": data.description,
                    "url": window.location.href,
                    "mainEntity": {
                        "@type": "ItemList",
                        "numberOfItems": categoryRecipes.length,
                        "itemListElement": categoryRecipes.slice(0, 5).map((recipe, index) => ({
                            "@type": "Recipe",
                            "position": index + 1,
                            "name": recipe.title,
                            "url": `${window.location.origin}/recipe.html?slug=${recipe.slug}`
                        }))
                    }
                };
                break;
        }

        structuredDataEl.textContent = JSON.stringify(structuredData, null, 2);
    }

    showNotFound() {
        const content = `
            <div class="not-found">
                <div class="not-found-icon">😔</div>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist or may have been moved.</p>
                <div class="not-found-actions">
                    <a href="/" class="btn btn-primary">Go Home</a>
                    <button onclick="history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    }

    showError(message) {
        const errorHtml = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Something went wrong</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = errorHtml;
        }
    }

    showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Link copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Link copied to clipboard!');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    // Utility method for external access
    static getInstance() {
        return window.RecipeBlogApp;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.RecipeBlogApp = new RecipeBlog();
});

// Service Worker Registration (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed');
            });
    });
}