import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardPage from './Dashboard.jsx';
import { categories as seedCategories, heroSlides as seedHeroSlides, jerseyBackByTeam, jerseyPrintByTeam, products as seedProducts, teams as seedTeams } from './data.js';
import { createOrder, fetchStoreContent, isSupabaseConfigured } from './supabaseApi.js';

const WHATSAPP_NUMBER = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const CURRENCY = 'DHS';

function formatPrice(value) {
  return `${value} ${CURRENCY}`;
}

const CATEGORY_LABELS_FR = {
  All: 'Tout',
  Jerseys: 'Maillots',
  Sandals: 'Sandales',
  Tattoos: 'Tatouages',
  Survette: 'Survêtements',
};

function getCategoryLabel(category) {
  return CATEGORY_LABELS_FR[category] || category;
}

const VIEW_PATHS = {
  home: '/',
  shop: '/shop',
  jerseys: '/jerseys',
  sandals: '/sandals',
  tattoos: '/tattoos',
  survette: '/survette',
  custom: '/custom-print',
  checkout: '/checkout',
  dashboard: '/dashboard',
};

function viewFromPath(pathname) {
  if (pathname === VIEW_PATHS.shop) return 'shop';
  if (pathname === VIEW_PATHS.jerseys) return 'jerseys';
  if (pathname === VIEW_PATHS.sandals) return 'sandals';
  if (pathname === VIEW_PATHS.tattoos) return 'tattoos';
  if (pathname === VIEW_PATHS.survette) return 'survette';
  if (pathname === VIEW_PATHS.custom) return 'custom';
  if (pathname === VIEW_PATHS.checkout) return 'checkout';
  if (pathname === VIEW_PATHS.dashboard) return 'dashboard';
  return 'home';
}

const SURVETTE_PATTERN = /(survette|tracksuit|track suit|hoodie|training|half[-\s]?zip|half[-\s]?pull|jacket|top)/i;

function getProductGroup(product) {
  if (product.category === 'Survette' || SURVETTE_PATTERN.test(product.name)) return 'Survette';
  return product.category;
}

function matchesProductGroup(product, group) {
  if (group === 'All') return true;
  if (group === 'Jerseys') return product.category === 'Jerseys' && getProductGroup(product) !== 'Survette';
  return getProductGroup(product) === group;
}

function getProductImage(product) {
  if (product.gallery?.length) return product.gallery[0];
  if (product.category !== 'Jerseys') return product.image;
  const filename = product.image.split('/').pop().replace(/\.[^.]+$/, '.webp');
  return `/jerseys-transparent/${filename}`;
}

function Icon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    back: <><path d="M19 12H5" /><path d="m10 17-5-5 5-5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /></>,
    whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.5 2.5 2 4 4.5 5" /></>,
    jersey: <><path d="M6.2 6.8h3.1c.5.8 1.4 1.3 2.7 1.3s2.2-.5 2.7-1.3h3.1l2.1 1.7v4.1h-2.7v6.8H6.8v-6.8H4.1V8.5l2.1-1.7Z" /><path d="M9.3 6.8v2.1c.6.7 1.5 1 2.7 1s2.1-.3 2.7-1V6.8" /><path d="M4.1 8.5h2.7M17.2 8.5h2.7M8.7 16.5h6.6" /><path d="m12.6 13.3 1.1-1.1M10.7 13.3l1.1-1.1" /></>,
    survette: <><path d="M9.2 4.4 5.6 6 4 15.1l2.8.7 1-5.6v9.2h8.4v-9.2l1 5.6 2.8-.7L18.4 6l-3.6-1.6" /><path d="M9.2 4.4h5.6l-1.3 3h-3l-1.3-3Z" /><path d="M12 7.4v12" /><path d="m8.3 8.5 3.7-1.1 3.7 1.1" /><path d="M8.9 17h6.2" /><path d="m9.1 13.7 1.1-1.1M13.8 13.7l1.1-1.1" /></>,
    sandal: <><path d="M4.3 14.9 8 7.4c.3-.7 1.1-1 1.8-.8l5.1 1.8c.7.2 1.2.9 1.2 1.7v1.7" /><path d="M4.1 15.4h8.5c1.2 0 2.2-.6 2.9-1.6l1.2-1.7" /><path d="M4.1 15.4 3.6 17h8.8c1.1 0 2.1-.5 2.8-1.3l1-1.2" /><path d="M8.1 8.6h5.6M9.4 10.9l3.1 1.1M6.6 14.7l.7 1.8M9.3 14.7 10 17M11.8 14.5l.8 1.9" /><circle cx="17.8" cy="14.7" r="3.6" /><path d="m17.8 12.8 1.1.8-.4 1.3h-1.4l-.4-1.3 1.1-.8Z" /><path d="m15.5 13.8 1.3-.2m2 .2 1.3-.2m-4.1 2 1-.8m2.3.8-.9-.8" /></>,
    tattoo: <><path d="M12 4.2 14.2 9l5.1.7-3.7 3.6.9 5.1-4.5-2.4-4.5 2.4.9-5.1-3.7-3.6L9.8 9 12 4.2Z" /><path d="m10 11.8 1.4 1.4 2.9-3.2" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function TeamMark({ team, small = false, sidebar = false }) {
  return (
    <span
      className={`team-mark team-logo-mark ${small ? 'team-mark-small' : ''} ${sidebar ? 'sidebar-team-mark' : ''}`}
      style={{ '--team-primary': team.colors[0], '--team-secondary': team.colors[1] }}
      aria-hidden="true"
    >
      <img
        src={team.logo}
        alt=""
        onError={(event) => {
          event.currentTarget.hidden = true;
          event.currentTarget.nextElementSibling.hidden = false;
        }}
      />
      <span className="team-logo-fallback" hidden>{team.code.slice(0, 2)}</span>
    </span>
  );
}

function MobileCategoryNav({ currentView, onNavigate }) {
  const items = [
    { view: 'jerseys', href: '/jerseys', label: 'Maillots', iconSrc: '/icons/jersey.png' },
    { view: 'survette', href: '/survette', label: 'Survêtements', iconSrc: '/icons/tracksuits.png' },
    { view: 'sandals', href: '/sandals', label: 'Sandales', iconSrc: '/icons/football-boot-ball-source.png' },
    { view: 'tattoos', href: '/tattoos', label: 'Tatouages', icon: 'tattoo' },
  ];

  return (
    <nav className="mobile-category-nav" aria-label="Catégories de produits">
      {items.map((item) => (
        <a
          key={item.view}
          href={item.href}
          className={currentView === item.view ? 'active' : ''}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(item.view);
          }}
          aria-label={item.label}
          title={item.label}
        >
          <span className="mobile-category-icon" aria-hidden="true">
            {item.iconSrc ? (
              <img src={item.iconSrc} alt="" aria-hidden="true" />
            ) : (
              <Icon name={item.icon} />
            )}
          </span>
        </a>
      ))}
    </nav>
  );
}

function ProductCard({ product, team, liked, onLike, onOpen }) {
  return (
    <article className="product-card">
      <div
        className={`product-visual product-open ${product.category === 'Jerseys' ? 'jersey-visual' : ''} ${product.category === 'Tattoos' ? 'tattoo-visual' : ''}`}
        style={{ '--product-color': product.color }}
        onClick={() => onOpen(product)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpen(product);
        }}
        role="button"
        tabIndex="0"
      >
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          type="button"
          className={`heart-button ${liked ? 'liked' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onLike(product.id);
          }}
          aria-label={liked ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
        >
          <Icon name="heart" />
        </button>
        <img src={getProductImage(product)} alt={product.name} />
        {product.category === 'Tattoos' && <TeamMark team={team} />}
      </div>
      <div className="product-info">
        <p className="product-category">{team.code} / {getCategoryLabel(product.category)}</p>
        <button className="product-title-button" onClick={() => onOpen(product)}><h3>{product.name}</h3></button>
        <div className="product-bottom">
          <p className="price">
            {formatPrice(product.price)}
            {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
          </p>
          <button className="quick-add" onClick={() => onOpen(product)} aria-label={`Voir ${product.name}`}>
            <span>Voir</span><Icon name="arrow" />
          </button>
        </div>
      </div>
    </article>
  );
}

function HomePage({ products, teams, heroSlides, likedProducts, onLike, onOpen }) {
  const heroTeamIds = ['morocco', 'brazil', 'france', 'argentina'];
  const featuredJerseys = heroTeamIds
    .map((teamId) => products.find((product) => product.teamId === teamId && product.category === 'Jerseys'))
    .filter(Boolean);
  const featuredSandals = products.filter((product) => product.category === 'Sandals').slice(0, 4);
  const featuredTattoos = products.filter((product) => product.category === 'Tattoos').slice(0, 4);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const renderProductSection = (title, items, id) => (
    <section className="catalog-section home-catalog" id={id}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="product-grid">
        {items.map((product) => {
          const team = teams.find((item) => item.id === product.teamId) || teams[0];
          return (
            <ProductCard
              key={product.id}
              product={product}
              team={team}
              liked={likedProducts.includes(product.id)}
              onLike={onLike}
              onOpen={(item) => onOpen(item, 'home')}
            />
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-media">
          <div className="home-hero-slides">
            {heroSlides.map((slide, index) => (
              <figure
                key={slide.id}
                className={`home-hero-slide ${index === activeSlide ? 'active' : ''}`}
                aria-hidden={index !== activeSlide}
              >
                <img src={slide.image} alt={slide.alt} />
              </figure>
            ))}
          </div>
          <div className="home-hero-overlay" aria-hidden="true" />
          <div className="home-hero-dots" aria-label="Images vedettes">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === activeSlide ? 'active' : ''}
                onClick={() => setActiveSlide(index)}
                aria-label={`Afficher l'image ${index + 1}`}
                aria-pressed={index === activeSlide}
              />
            ))}
          </div>
        </div>
      </section>

      {featuredJerseys.length > 0 && renderProductSection('Maillots en vedette.', featuredJerseys, 'featured')}
      {featuredSandals.length > 0 && renderProductSection('Sandales.', featuredSandals, 'sandals')}
      {featuredTattoos.length > 0 && renderProductSection('Tatouages.', featuredTattoos, 'tattoos')}
    </>
  );
}

const PRODUCT_PAGE_COPY = {
  Jerseys: {
    heading: 'Maillots',
    accent: 'prêts pour le match.',
    description: 'Découvrez les maillots des équipes nationales, domiciles, extérieurs et les essentiels des supporters.',
  },
  Sandals: {
    heading: 'Sandales',
    accent: 'confort supporter.',
    description: 'Claquettes et sandales faciles à porter au quotidien, aux couleurs nationales pour les jours de match et la rue.',
  },
  Tattoos: {
    heading: 'Tatouages',
    accent: 'petits détails.',
    description: 'Tatouages temporaires de supporters et emblèmes d’équipes pour les soirs de match, les photos et l’ambiance du stade.',
  },
  Survette: {
    heading: 'Survêtements',
    accent: 'style entraînement.',
    description: 'Sweats, survêtements, hauts d’entraînement et couches chaudes inspirés des collections des équipes nationales.',
  },
};

function CategoryPage({ categoryName, products, teams, likedProducts, onLike, onOpen, returnView }) {
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const pageCopy = PRODUCT_PAGE_COPY[categoryName];
  const groupedProducts = useMemo(
    () => products.filter((product) => matchesProductGroup(product, categoryName)),
    [products, categoryName],
  );
  const availableTeams = useMemo(() => teams.filter((team) => (
    groupedProducts.some((product) => product.teamId === team.id)
  )), [teams, groupedProducts]);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groupedProducts.filter((product) => {
      const team = teams.find((item) => item.id === product.teamId);
      const matchesTeam = teamFilter === 'All' || product.teamId === teamFilter;
      const searchableText = `${product.name} ${product.category} ${team?.name || ''} ${team?.code || ''}`.toLowerCase();
      return matchesTeam && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [groupedProducts, query, teamFilter, teams]);

  const resetFilters = () => {
    setQuery('');
    setTeamFilter('All');
  };

  return (
    <>
      <section className="category-hero">
        <div>
          <p className="eyebrow">Boutique par catégorie</p>
          <h1>{pageCopy.heading}<br /><em>{pageCopy.accent}</em></h1>
          <p>{pageCopy.description}</p>
        </div>
        <label className="category-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Rechercher ${getCategoryLabel(categoryName).toLowerCase()}`}
            aria-label={`Rechercher ${getCategoryLabel(categoryName)}`}
          />
        </label>
      </section>

      <section className="catalog-section shop-catalog category-catalog">
        <div className="filter-row category-team-row">
          <button className={teamFilter === 'All' ? 'active' : ''} onClick={() => setTeamFilter('All')}>Toutes les équipes</button>
          {availableTeams.map((team) => (
            <button key={team.id} className={teamFilter === team.id ? 'active' : ''} onClick={() => setTeamFilter(team.id)}>
              {team.name}
            </button>
          ))}
        </div>

        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product) => {
              const team = teams.find((item) => item.id === product.teamId) || teams[0];
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  team={team}
                  liked={likedProducts.includes(product.id)}
                  onLike={onLike}
                  onOpen={(item) => onOpen(item, returnView)}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Aucun produit trouvé</h3>
            <p>Essayez une autre équipe ou un autre mot-clé.</p>
            <button onClick={resetFilters}>Réinitialiser les filtres</button>
          </div>
        )}
      </section>
    </>
  );
}

function ProductPage({ product, team, liked, onLike, onBack, onAdd, onCheckout }) {
  const sizes = product.category === 'Jerseys' || product.category === 'Survette'
    ? ['S', 'M', 'L', 'XL', '2XL', '3XL']
    : product.category === 'Tattoos'
      ? ['One size']
      : ['38', '39', '40', '41', '42', '43', '44'];
  const [size, setSize] = useState(sizes[1] || sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const gallery = product.gallery?.length ? product.gallery : [getProductImage(product)];
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const galleryRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [canScrollGalleryPrev, setCanScrollGalleryPrev] = useState(false);
  const [canScrollGalleryNext, setCanScrollGalleryNext] = useState(gallery.length > 3);

  const updateGalleryNav = () => {
    const node = galleryRef.current;
    if (!node) return;
    const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
    setCanScrollGalleryPrev(node.scrollLeft > 4);
    setCanScrollGalleryNext(node.scrollLeft < maxScrollLeft - 4);
  };

  const scrollGalleryByStep = (direction) => {
    const node = galleryRef.current;
    if (!node) return;
    const step = Math.max(node.clientWidth / 3, 120);
    node.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  useEffect(() => {
    setSelectedImage(gallery[0]);
    setIsZoomOpen(false);
    const node = galleryRef.current;
    if (!node) return;
    node.scrollLeft = 0;
    updateGalleryNav();
  }, [product.id]);

  useEffect(() => {
    updateGalleryNav();
  }, [gallery.length]);

  useEffect(() => {
    if (!isZoomOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsZoomOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomOpen]);

  const handleGalleryPointerDown = (event) => {
    const node = galleryRef.current;
    if (!node) return;
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: node.scrollLeft,
    };
    node.setPointerCapture(event.pointerId);
    node.classList.add('dragging');
  };

  const handleGalleryPointerMove = (event) => {
    const node = galleryRef.current;
    const dragState = dragStateRef.current;
    if (!node || !dragState.active) return;
    const deltaX = event.clientX - dragState.startX;
    node.scrollLeft = dragState.startScrollLeft - deltaX;
    updateGalleryNav();
  };

  const handleGalleryPointerUp = (event) => {
    const node = galleryRef.current;
    if (!node) return;
    dragStateRef.current.active = false;
    if (node.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    node.classList.remove('dragging');
    updateGalleryNav();
  };

  return (
    <section className="product-page">
      <button className="back-button" onClick={onBack}><Icon name="back" /> Retour à la boutique</button>
      <div className="product-detail-grid">
        <div className="detail-media">
          <div
            className={`detail-image ${product.category === 'Jerseys' ? 'jersey-detail-image' : ''}`}
            style={{ '--product-color': product.color }}
            onClick={() => setIsZoomOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsZoomOpen(true);
              }
            }}
            role="button"
            tabIndex="0"
            aria-label={`Zoomer l'image de ${product.name}`}
          >
            {product.badge && <span className="product-badge">{product.badge}</span>}
            <img src={selectedImage} alt={product.name} />
            <span className="detail-image-zoom-hint">Touchez pour zoomer</span>
          </div>

          {gallery.length > 1 && (
            <div className="detail-gallery-wrap">
              <div className="detail-gallery-toolbar">
                <strong>Variantes d’image</strong>
                {gallery.length > 3 && (
                  <div className="detail-gallery-nav">
                    <button
                      type="button"
                      onClick={() => scrollGalleryByStep(-1)}
                      disabled={!canScrollGalleryPrev}
                      aria-label="Images précédentes"
                    >
                      <Icon name="back" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGalleryByStep(1)}
                      disabled={!canScrollGalleryNext}
                      aria-label="Images suivantes"
                    >
                      <Icon name="arrow" />
                    </button>
                  </div>
                )}
              </div>
              <div
                ref={galleryRef}
                className="detail-gallery detail-gallery-carousel"
                onScroll={updateGalleryNav}
                onPointerDown={handleGalleryPointerDown}
                onPointerMove={handleGalleryPointerMove}
                onPointerUp={handleGalleryPointerUp}
                onPointerCancel={handleGalleryPointerUp}
              >
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={selectedImage === image ? 'active' : ''}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Afficher l'image produit ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{team.name} / {getCategoryLabel(product.category)}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)} {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}</p>
          <p className="detail-description">
            Un essentiel de supporter avec une coupe confortable au quotidien, une finition premium et des couleurs inspirées de {team.name}.
          </p>

          <div className="product-option">
            <div className="option-heading"><strong>Choisir la taille</strong><span>Guide des tailles</span></div>
            <div className="size-list">
              {sizes.map((item) => (
                <button key={item} className={size === item ? 'active' : ''} onClick={() => setSize(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="product-option">
            <strong>Quantité</strong>
            <div className="quantity-control">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuer la quantité"><Icon name="minus" /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} aria-label="Augmenter la quantité"><Icon name="plus" /></button>
            </div>
          </div>

          <div className="detail-actions">
            <button className="add-bag-button" onClick={() => onAdd(product, size, quantity)}>Ajouter au panier — {formatPrice(product.price * quantity)}</button>
            <button
              className={`detail-heart ${liked ? 'liked' : ''}`}
              onClick={() => onLike(product.id)}
              aria-label="Basculer le favori"
            ><Icon name="heart" /></button>
          </div>

          <button className="buy-now-button" onClick={() => onCheckout(product, size, quantity)}>Acheter maintenant</button>

          <div className="detail-benefits">
            <span><strong>Livraison rapide</strong> Expédié sous 48 heures</span>
            <span><strong>Retours faciles</strong> Retour sous 30 jours</span>
            <span><strong>Commande sécurisée</strong> Confirmation directe sur WhatsApp</span>
          </div>
        </div>
      </div>

      {isZoomOpen && (
        <div
          className="detail-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Image agrandie de ${product.name}`}
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            className="detail-zoom-close"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Fermer l’image agrandie"
          >
            <Icon name="close" />
          </button>
          <div className="detail-zoom-stage" onClick={(event) => event.stopPropagation()}>
            <img src={selectedImage} alt={product.name} />
          </div>
        </div>
      )}
    </section>
  );
}

function CheckoutPage({ cart, onBack, onUpdateQuantity, onRemove }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', note: '' });
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) return;
    const orderLines = cart.map((item, index) => (
      `${index + 1}. ${item.product.name}\nTaille : ${item.size}\nQuantité : ${item.quantity}\nPrix : ${formatPrice(item.product.price * item.quantity)}`
    )).join('\n\n');
    const message = [
      'Bonjour Kitline, je souhaite passer une commande :',
      '',
      orderLines,
      '',
      `Total : ${formatPrice(total)}`,
      '',
      `Nom : ${form.name}`,
      `Téléphone : ${form.phone}`,
      `Ville : ${form.city}`,
      `Adresse : ${form.address}`,
      form.note ? `Note : ${form.note}` : '',
    ].filter(Boolean).join('\n');

    if (isSupabaseConfigured) {
      try {
        await createOrder({
          customer_name: form.name,
          phone: form.phone,
          city: form.city,
          address: form.address,
          note: form.note || null,
          items: cart.map((item) => ({
            product_id: item.product.dbId || item.product.id,
            product_name: item.product.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total,
          status: 'whatsapp_opened',
        });
      } catch (error) {
        console.warn(error);
      }
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="checkout-page">
      <button className="back-button" onClick={onBack}><Icon name="back" /> Continuer vos achats</button>
      <div className="checkout-heading">
        <p className="eyebrow">Dernière étape</p>
        <h1>Finalisez votre commande.</h1>
        <p>Renseignez vos informations de livraison, puis confirmez la commande via WhatsApp.</p>
      </div>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submitOrder}>
          <h2>Détails de livraison</h2>
          <div className="form-grid">
            <label>Nom complet<input required name="name" value={form.name} onChange={updateForm} placeholder="Votre nom complet" /></label>
            <label>Téléphone / WhatsApp<input required name="phone" value={form.phone} onChange={updateForm} placeholder="+212 6..." /></label>
            <label>Ville<input required name="city" value={form.city} onChange={updateForm} placeholder="Votre ville" /></label>
            <label className="full-field">Adresse de livraison<input required name="address" value={form.address} onChange={updateForm} placeholder="Rue, quartier, immeuble..." /></label>
            <label className="full-field">Note de commande<textarea name="note" value={form.note} onChange={updateForm} placeholder="Optionnel : nom du joueur, numéro du maillot, couleur souhaitée..." /></label>
          </div>
          <button className="whatsapp-order" type="submit" disabled={!cart.length}><Icon name="whatsapp" /> Commander via WhatsApp — {formatPrice(total)}</button>
          <p className="form-note">WhatsApp s’ouvrira avec votre commande complète prête à être envoyée.</p>
        </form>

        <aside className="order-summary">
          <div className="summary-title"><h2>Votre commande</h2><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)</span></div>
          {cart.length ? cart.map((item) => (
            <article className="cart-item" key={item.key}>
              <img src={getProductImage(item.product)} alt={item.product.name} />
              <div>
                <h3>{item.product.name}</h3>
                <p>Taille : {item.size}</p>
                <div className="cart-item-bottom">
                  <div className="quantity-control small">
                    <button type="button" onClick={() => onUpdateQuantity(item.key, -1)}><Icon name="minus" /></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onUpdateQuantity(item.key, 1)}><Icon name="plus" /></button>
                  </div>
                  <strong>{formatPrice(item.product.price * item.quantity)}</strong>
                </div>
              </div>
              <button className="remove-item" onClick={() => onRemove(item.key)} aria-label={`Retirer ${item.product.name}`}><Icon name="trash" /></button>
            </article>
          )) : (
            <div className="cart-empty"><Icon name="bag" /><h3>Votre panier est vide</h3><p>Ajoutez un produit avant de finaliser la commande.</p></div>
          )}
          <div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          <p className="delivery-note">Les frais de livraison sont confirmés sur WhatsApp selon votre ville.</p>
        </aside>
      </div>
    </section>
  );
}

function CustomPrintPage({ teams, products, selectedTeamId, onBack }) {
  const [printName, setPrintName] = useState('VOTRE NOM');
  const [printNumber, setPrintNumber] = useState('10');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: '', phone: '', city: '', note: '' });

  const team = teams.find((item) => item.id === selectedTeamId) || teams[0];
  const jersey = products.find((product) => product.teamId === team.id && product.id.endsWith('-home'));
  const jerseyImage = jerseyBackByTeam[team.id] || (jersey ? getProductImage(jersey) : '');
  const printPlacement = jerseyPrintByTeam[team.id] || {};
  const displayName = printName.trim().toUpperCase() || 'VOTRE NOM';
  const displayNumber = String(printNumber || '10').replace(/\D/g, '').slice(0, 2) || '10';
  const printColor = printPlacement.color || '#ffffff';
  const printOutline = printPlacement.outline || 'rgba(0,0,0,.7)';
  const customPrice = 104;
  const total = customPrice * quantity;

  const updateCustomer = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const submitCustomOrder = (event) => {
    event.preventDefault();
    const message = [
      'Bonjour Kitline, je souhaite commander mon maillot personnalisé :',
      '',
      `Équipe : ${team.name}`,
      `Nom imprimé : ${displayName}`,
      `Numéro imprimé : ${displayNumber}`,
      `Taille : ${size}`,
      `Quantité : ${quantity}`,
      `Total : ${formatPrice(total)}`,
      '',
      `Nom du client : ${customer.name}`,
      `Téléphone : ${customer.phone}`,
      `Ville : ${customer.city}`,
      customer.note ? `Note : ${customer.note}` : '',
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="custom-page">
      <button className="back-button" onClick={onBack}><Icon name="back" /> Retour à la boutique</button>

      <div className="custom-heading">
        <p className="eyebrow">Votre maillot</p>
        <h1>Créez votre maillot.</h1>
        <p>Choisissez une équipe, saisissez votre nom et votre numéro, prévisualisez en direct puis envoyez la commande via WhatsApp.</p>
      </div>

      <div className="custom-grid">
        <div
          className="custom-preview-card"
          style={{
            '--product-color': team.colors[0],
            '--print-color': printColor,
            '--print-outline': printOutline,
            '--print-top': printPlacement.top || '29.6%',
            '--print-width': printPlacement.width || '35%',
          }}
        >
          <div className="custom-preview-stage">
            {jerseyImage && <img src={jerseyImage} alt={`Aperçu du dos du maillot ${team.name}`} />}
            <div className="jersey-print-layer" aria-hidden="true">
              <span className="print-name">{displayName}</span>
              <span className="print-number">{displayNumber}</span>
            </div>
          </div>
          <div className="custom-preview-meta">
            <TeamMark team={team} small />
            <span>{team.name} Votre maillot</span>
          </div>
        </div>

        <form className="custom-form" onSubmit={submitCustomOrder}>
          <h2>Personnalisez votre maillot</h2>

          <div className="custom-selected-team">
            <TeamMark team={team} small />
            <div>
              <span>Sélectionné depuis la barre latérale</span>
              <strong>{team.name}</strong>
              <p>Utilisez la barre latérale verticale des équipes pour changer l’aperçu du maillot.</p>
            </div>
          </div>

          <div className="form-grid compact">
            <label>
              Nom à imprimer
              <input
                maxLength="12"
                value={printName}
                onChange={(event) => setPrintName(event.target.value)}
                placeholder="Exemple : AMINE"
              />
            </label>
            <label>
              Numéro
              <input
                inputMode="numeric"
                maxLength="2"
                value={printNumber}
                onChange={(event) => setPrintNumber(event.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="10"
              />
            </label>
          </div>

          <div className="product-option custom-option">
            <div className="option-heading"><strong>Choisir la taille</strong><span>Impression incluse</span></div>
            <div className="size-list">
              {['S', 'M', 'L', 'XL', '2XL'].map((item) => (
                <button type="button" key={item} className={size === item ? 'active' : ''} onClick={() => setSize(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="product-option custom-option">
            <strong>Quantité</strong>
            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuer la quantité"><Icon name="minus" /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Augmenter la quantité"><Icon name="plus" /></button>
            </div>
          </div>

          <h2 className="custom-form-subtitle">Coordonnées</h2>
          <div className="form-grid compact">
            <label>Nom complet<input required name="name" value={customer.name} onChange={updateCustomer} placeholder="Votre nom" /></label>
            <label>WhatsApp<input required name="phone" value={customer.phone} onChange={updateCustomer} placeholder="+212 6..." /></label>
            <label>Ville<input required name="city" value={customer.city} onChange={updateCustomer} placeholder="Votre ville" /></label>
            <label>Note<input name="note" value={customer.note} onChange={updateCustomer} placeholder="Détails optionnels" /></label>
          </div>

          <button className="whatsapp-order custom-submit" type="submit">
            <Icon name="whatsapp" /> Commander votre maillot — {formatPrice(total)}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function App() {
  const [selectedTeamId, setSelectedTeamId] = useState('morocco');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [view, setView] = useState(() => viewFromPath(window.location.pathname));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReturnView, setProductReturnView] = useState('home');
  const [storeProducts, setStoreProducts] = useState(seedProducts);
  const [storeTeams, setStoreTeams] = useState(seedTeams);
  const [storeCategories, setStoreCategories] = useState(seedCategories);
  const [storeHeroSlides, setStoreHeroSlides] = useState(seedHeroSlides);
  const [contentNotice, setContentNotice] = useState('');

  const selectedTeam = storeTeams.find((team) => team.id === selectedTeamId) || storeTeams[0];
  const teamsWithProducts = useMemo(() => new Set(storeProducts.map((product) => product.teamId)), [storeProducts]);
  const sidebarTeams = useMemo(() => [...storeTeams].sort((first, second) => {
    const firstHasProducts = teamsWithProducts.has(first.id);
    const secondHasProducts = teamsWithProducts.has(second.id);
    if (firstHasProducts !== secondHasProducts) return firstHasProducts ? -1 : 1;
    return 0;
  }), [storeTeams, teamsWithProducts]);
  const categoryFilters = ['All', ...new Set([...storeCategories.map((item) => item.name), 'Survette'])];
  const filteredProducts = useMemo(() => storeProducts.filter((product) => {
    const matchesTeam = product.teamId === selectedTeamId;
    const matchesCategory = matchesProductGroup(product, category);
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesTeam && matchesCategory && matchesSearch;
  }), [storeProducts, selectedTeamId, category, search]);

  const refreshStoreContent = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const content = await fetchStoreContent();
      if (content.products.length) setStoreProducts(content.products);
      if (content.teams.length) {
        setStoreTeams(content.teams);
        if (!content.teams.some((team) => team.id === selectedTeamId)) {
          setSelectedTeamId(content.teams[0].id);
        }
      }
      if (content.categories.length) setStoreCategories(content.categories);
      if (content.heroSlides.length) setStoreHeroSlides(content.heroSlides);
      setContentNotice('');
    } catch (error) {
      setContentNotice(`Contenu local utilisé car Supabase n’a pas pu être chargé : ${error.message}`);
    }
  };

  const navigateView = (nextView, { replace = false } = {}) => {
    setView(nextView);
    const nextPath = VIEW_PATHS[nextView] || VIEW_PATHS.shop;
    if (window.location.pathname !== nextPath) {
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({ view: nextView }, '', nextPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProduct(null);
      setView(viewFromPath(window.location.pathname));
      window.scrollTo({ top: 0 });
    };

    window.history.replaceState({ view }, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    refreshStoreContent();
  }, []);

  const selectTeam = (teamId, options = {}) => {
    setSelectedTeamId(teamId);
    setCategory('All');
    setSearch('');
    if (options.stayOnCustom) {
      navigateView('custom', { replace: true });
    } else {
      navigateView('shop');
      setSelectedProduct(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProduct = (product, returnView = view) => {
    setSelectedProduct(product);
    setProductReturnView(returnView);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHome = () => {
    navigateView('home');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showShop = () => {
    navigateView('shop');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showCatalogView = (nextView) => {
    navigateView(nextView);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showCheckout = () => {
    navigateView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showCustom = () => {
    navigateView('custom');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product, size = product.category === 'Jerseys' || product.category === 'Survette' ? 'M' : product.category === 'Tattoos' ? 'One size' : '39', quantity = 1) => {
    const key = `${product.id}-${size}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      return existing
        ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { key, product, size, quantity }];
    });
    setNotice(`${product.name} a été ajouté à votre panier`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const buyNow = (product, size, quantity) => {
    addToCart(product, size, quantity);
    navigateView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateCartQuantity = (key, change) => {
    setCart((current) => current
      .map((item) => item.key === key ? { ...item, quantity: item.quantity + change } : item)
      .filter((item) => item.quantity > 0));
  };

  const toggleFavorite = (productId) => {
    setFavorites((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  return (
    <div className={`app-shell ${view === 'dashboard' ? 'dashboard-open' : ''}`}>
      <header className="site-header">
        <button className="brand brand-button" onClick={showHome} aria-label="Accueil Kitline">
          <span className="brand-ball">K</span>
          <span>KITLINE</span>
        </button>

        <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Navigation principale">
          <a href="/" onClick={(event) => { event.preventDefault(); showHome(); setMenuOpen(false); }}>Accueil</a>
          <a href="/shop" onClick={(event) => { event.preventDefault(); showShop(); setMenuOpen(false); }}>Boutique</a>
          <a href="/jerseys" onClick={(event) => { event.preventDefault(); showCatalogView('jerseys'); setMenuOpen(false); }}>Maillots</a>
          <a href="/sandals" onClick={(event) => { event.preventDefault(); showCatalogView('sandals'); setMenuOpen(false); }}>Sandales</a>
          <a href="/tattoos" onClick={(event) => { event.preventDefault(); showCatalogView('tattoos'); setMenuOpen(false); }}>Tatouages</a>
          <a href="/survette" onClick={(event) => { event.preventDefault(); showCatalogView('survette'); setMenuOpen(false); }}>Survêtements</a>
          <a href="/custom-print" onClick={(event) => { event.preventDefault(); showCustom(); setMenuOpen(false); }}>Votre maillot</a>
        </nav>

        <div className="header-actions">
          <label className="search-box">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher dans cette équipe"
              aria-label="Rechercher des produits"
            />
          </label>
          <button className="header-icon" aria-label={`${favorites.length} favoris`}>
            <Icon name="heart" /><span>{favorites.length}</span>
          </button>
          <button className="header-icon" onClick={showCheckout} aria-label={`${cart.length} produits dans le panier`}>
            <Icon name="bag" /><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Ouvrir ou fermer le menu">
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      {view !== 'dashboard' && <aside className="team-sidebar" id="teams">
        <div className="team-list">
          {sidebarTeams.map((team) => (
            <button
              key={team.id}
              className={`team-button ${selectedTeamId === team.id ? 'active' : ''}`}
              onClick={() => selectTeam(team.id, { stayOnCustom: view === 'custom' })}
              title={team.name}
              aria-label={`Afficher les produits de ${team.name}`}
            >
              <TeamMark team={team} sidebar />
              <span className="team-tooltip">{team.name}</span>
            </button>
          ))}
        </div>
      </aside>}

      {view !== 'dashboard' && (
        <MobileCategoryNav currentView={view} onNavigate={showCatalogView} />
      )}

      <main>
        {contentNotice && <div className="content-notice">{contentNotice}</div>}

        {view === 'home' && (
          <HomePage
            products={storeProducts}
            teams={storeTeams}
            heroSlides={storeHeroSlides}
            likedProducts={favorites}
            onLike={toggleFavorite}
            onOpen={openProduct}
          />
        )}

        {view === 'shop' && (
          <>
        <section className="hero shop-hero" style={{ '--hero-color': selectedTeam.colors[0], '--hero-accent': selectedTeam.colors[1] }}>
          <div className="hero-copy">
            <p className="eyebrow">Boutique équipe</p>
            <h1>{selectedTeam.name}<br /><em>collection.</em></h1>
            <p className="hero-description">
              Maillots, sandales, tatouages et articles de supporter au même endroit.
            </p>
          </div>
        </section>

        <section className="catalog-section shop-catalog" id="shop">
          {/* <div className="section-heading">
            <div>
              <h2>{selectedTeam.name} products.</h2>
            </div>
            <p>{filteredProducts.length} products</p>
          </div> */}

          <div className="filter-row">
            {categoryFilters.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {getCategoryLabel(item)}
              </button>
            ))}
          </div>

          {filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  team={selectedTeam}
                  liked={favorites.includes(product.id)}
                  onLike={toggleFavorite}
                  onOpen={(item) => openProduct(item, 'shop')}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Aucun produit trouvé</h3>
              <p>Essayez une autre catégorie ou un autre mot-clé.</p>
              <button onClick={() => { setSearch(''); setCategory('All'); }}>Réinitialiser les filtres</button>
            </div>
          )}
        </section>

        <section className="story-section" id="story">
          <p className="eyebrow">Des tribunes à la rue</p>
          <h2>Votre équipe n’est pas seulement celle que vous regardez.<br />Elle fait partie de qui vous êtes.</h2>
          <div className="story-points">
            <span>Finition premium</span><span>Approuvé par les supporters</span><span>Livraison mondiale</span>
          </div>
        </section>
          </>
        )}

        {view === 'jerseys' && (
          <CategoryPage
            categoryName="Jerseys"
            products={storeProducts}
            teams={storeTeams}
            likedProducts={favorites}
            onLike={toggleFavorite}
            onOpen={openProduct}
            returnView="jerseys"
          />
        )}

        {view === 'sandals' && (
          <CategoryPage
            categoryName="Sandals"
            products={storeProducts}
            teams={storeTeams}
            likedProducts={favorites}
            onLike={toggleFavorite}
            onOpen={openProduct}
            returnView="sandals"
          />
        )}

        {view === 'tattoos' && (
          <CategoryPage
            categoryName="Tattoos"
            products={storeProducts}
            teams={storeTeams}
            likedProducts={favorites}
            onLike={toggleFavorite}
            onOpen={openProduct}
            returnView="tattoos"
          />
        )}

        {view === 'survette' && (
          <CategoryPage
            categoryName="Survette"
            products={storeProducts}
            teams={storeTeams}
            likedProducts={favorites}
            onLike={toggleFavorite}
            onOpen={openProduct}
            returnView="survette"
          />
        )}

        {view === 'product' && selectedProduct && (
          <ProductPage
            key={selectedProduct.id}
            product={selectedProduct}
            team={storeTeams.find((team) => team.id === selectedProduct.teamId) || selectedTeam}
            liked={favorites.includes(selectedProduct.id)}
            onLike={toggleFavorite}
            onBack={() => showCatalogView(productReturnView)}
            onAdd={addToCart}
            onCheckout={buyNow}
          />
        )}

        {view === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onBack={showShop}
            onUpdateQuantity={updateCartQuantity}
            onRemove={(key) => setCart((current) => current.filter((item) => item.key !== key))}
          />
        )}

        {view === 'custom' && (
          <CustomPrintPage
            teams={storeTeams}
            products={storeProducts}
            selectedTeamId={selectedTeamId}
            onBack={showShop}
          />
        )}

        {view === 'dashboard' && (
          <DashboardPage
            seedProducts={seedProducts}
            seedTeams={seedTeams}
            seedCategories={seedCategories}
            onRefreshStore={refreshStoreContent}
          />
        )}
      </main>

      <footer>
        <a className="brand" href="#"><span className="brand-ball">K</span><span>KITLINE</span></a>
        <p>Couleurs nationales. Style au quotidien.</p>
        <p>© 2026 Kitline</p>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
