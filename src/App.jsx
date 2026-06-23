import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardPage from './Dashboard.jsx';
import { categories as seedCategories, heroSlides as seedHeroSlides, jerseyBackByTeam, jerseyPrintByTeam, products as seedProducts, teams as seedTeams } from './data.js';
import { createOrder, fetchStoreContent, isSupabaseConfigured } from './supabaseApi.js';

const WHATSAPP_NUMBER = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const CURRENCY = 'DHS';

function formatPrice(value) {
  return `${value} ${CURRENCY}`;
}

const VIEW_PATHS = {
  home: '/',
  shop: '/shop',
  custom: '/custom-print',
  checkout: '/checkout',
  dashboard: '/dashboard',
};

function viewFromPath(pathname) {
  if (pathname === VIEW_PATHS.shop) return 'shop';
  if (pathname === VIEW_PATHS.custom) return 'custom';
  if (pathname === VIEW_PATHS.checkout) return 'checkout';
  if (pathname === VIEW_PATHS.dashboard) return 'dashboard';
  return 'home';
}

function getProductImage(product) {
  if (product.gallery?.length) return product.gallery[0];
  if (product.category !== 'Jerseys') return product.image;
  const filename = product.image.split('/').pop().replace(/\.[^.]+$/, '.png');
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
          aria-label={liked ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
        >
          <Icon name="heart" />
        </button>
        <img src={getProductImage(product)} alt={product.name} />
        {product.category === 'Tattoos' && <TeamMark team={team} />}
      </div>
      <div className="product-info">
        <p className="product-category">{team.code} / {product.category}</p>
        <button className="product-title-button" onClick={() => onOpen(product)}><h3>{product.name}</h3></button>
        <div className="product-bottom">
          <p className="price">
            {formatPrice(product.price)}
            {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
          </p>
          <button className="quick-add" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
            <span>View</span><Icon name="arrow" />
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
          <div className="home-hero-dots" aria-label="Hero images">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === activeSlide ? 'active' : ''}
                onClick={() => setActiveSlide(index)}
                aria-label={`Show hero image ${index + 1}`}
                aria-pressed={index === activeSlide}
              />
            ))}
          </div>
        </div>
      </section>

      {featuredJerseys.length > 0 && renderProductSection('Featured jerseys.', featuredJerseys, 'featured')}
      {featuredSandals.length > 0 && renderProductSection('Sandals.', featuredSandals, 'sandals')}
      {featuredTattoos.length > 0 && renderProductSection('Tattoos.', featuredTattoos, 'tattoos')}
    </>
  );
}

function ProductPage({ product, team, liked, onLike, onBack, onAdd, onCheckout }) {
  const sizes = product.category === 'Jerseys'
    ? ['S', 'M', 'L', 'XL', '2XL']
    : product.category === 'Tattoos'
      ? ['One size']
      : ['38', '39', '40', '41', '42', '43', '44'];
  const [size, setSize] = useState(sizes[1] || sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const gallery = product.gallery?.length ? product.gallery : [getProductImage(product)];
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
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
    const node = galleryRef.current;
    if (!node) return;
    node.scrollLeft = 0;
    updateGalleryNav();
  }, [product.id]);

  useEffect(() => {
    updateGalleryNav();
  }, [gallery.length]);

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
      <button className="back-button" onClick={onBack}><Icon name="back" /> Back to shop</button>
      <div className="product-detail-grid">
        <div className="detail-media">
          <div className={`detail-image ${product.category === 'Jerseys' ? 'jersey-detail-image' : ''}`} style={{ '--product-color': product.color }}>
            {product.badge && <span className="product-badge">{product.badge}</span>}
            <img src={selectedImage} alt={product.name} />
          </div>

          {gallery.length > 1 && (
            <div className="detail-gallery-wrap">
              <div className="detail-gallery-toolbar">
                <strong>Image variants</strong>
                {gallery.length > 3 && (
                  <div className="detail-gallery-nav">
                    <button
                      type="button"
                      onClick={() => scrollGalleryByStep(-1)}
                      disabled={!canScrollGalleryPrev}
                      aria-label="Previous gallery images"
                    >
                      <Icon name="back" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGalleryByStep(1)}
                      disabled={!canScrollGalleryNext}
                      aria-label="Next gallery images"
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
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{team.name} / {product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)} {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}</p>
          <p className="detail-description">
            A supporter essential with a comfortable everyday fit, premium finish, and colors inspired by {team.name}.
          </p>

          <div className="product-option">
            <div className="option-heading"><strong>Select size</strong><span>Size guide</span></div>
            <div className="size-list">
              {sizes.map((item) => (
                <button key={item} className={size === item ? 'active' : ''} onClick={() => setSize(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="product-option">
            <strong>Quantity</strong>
            <div className="quantity-control">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Icon name="minus" /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Icon name="plus" /></button>
            </div>
          </div>

          <div className="detail-actions">
            <button className="add-bag-button" onClick={() => onAdd(product, size, quantity)}>Add to bag — {formatPrice(product.price * quantity)}</button>
            <button
              className={`detail-heart ${liked ? 'liked' : ''}`}
              onClick={() => onLike(product.id)}
              aria-label="Toggle favorite"
            ><Icon name="heart" /></button>
          </div>

          <button className="buy-now-button" onClick={() => onCheckout(product, size, quantity)}>Buy now</button>

          <div className="detail-benefits">
            <span><strong>Fast delivery</strong> Dispatched within 48 hours</span>
            <span><strong>Easy returns</strong> Return within 30 days</span>
            <span><strong>Secure order</strong> Confirm directly on WhatsApp</span>
          </div>
        </div>
      </div>
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
      `${index + 1}. ${item.product.name}\nSize: ${item.size}\nQuantity: ${item.quantity}\nPrice: ${formatPrice(item.product.price * item.quantity)}`
    )).join('\n\n');
    const message = [
      'Hello Kitline, I would like to place an order:',
      '',
      orderLines,
      '',
      `Total: ${formatPrice(total)}`,
      '',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `City: ${form.city}`,
      `Address: ${form.address}`,
      form.note ? `Note: ${form.note}` : '',
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
      <button className="back-button" onClick={onBack}><Icon name="back" /> Continue shopping</button>
      <div className="checkout-heading">
        <p className="eyebrow">Final step</p>
        <h1>Complete your order.</h1>
        <p>Fill in your delivery details, then confirm the order through WhatsApp.</p>
      </div>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submitOrder}>
          <h2>Delivery details</h2>
          <div className="form-grid">
            <label>Full name<input required name="name" value={form.name} onChange={updateForm} placeholder="Your full name" /></label>
            <label>Phone / WhatsApp<input required name="phone" value={form.phone} onChange={updateForm} placeholder="+212 6..." /></label>
            <label>City<input required name="city" value={form.city} onChange={updateForm} placeholder="Your city" /></label>
            <label className="full-field">Delivery address<input required name="address" value={form.address} onChange={updateForm} placeholder="Street, area, building..." /></label>
            <label className="full-field">Order note<textarea name="note" value={form.note} onChange={updateForm} placeholder="Optional: player name, jersey number, preferred color..." /></label>
          </div>
          <button className="whatsapp-order" type="submit" disabled={!cart.length}><Icon name="whatsapp" /> Order via WhatsApp — {formatPrice(total)}</button>
          <p className="form-note">WhatsApp will open with your complete order ready to send.</p>
        </form>

        <aside className="order-summary">
          <div className="summary-title"><h2>Your order</h2><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
          {cart.length ? cart.map((item) => (
            <article className="cart-item" key={item.key}>
              <img src={getProductImage(item.product)} alt={item.product.name} />
              <div>
                <h3>{item.product.name}</h3>
                <p>Size: {item.size}</p>
                <div className="cart-item-bottom">
                  <div className="quantity-control small">
                    <button type="button" onClick={() => onUpdateQuantity(item.key, -1)}><Icon name="minus" /></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onUpdateQuantity(item.key, 1)}><Icon name="plus" /></button>
                  </div>
                  <strong>{formatPrice(item.product.price * item.quantity)}</strong>
                </div>
              </div>
              <button className="remove-item" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.product.name}`}><Icon name="trash" /></button>
            </article>
          )) : (
            <div className="cart-empty"><Icon name="bag" /><h3>Your bag is empty</h3><p>Add a product before checking out.</p></div>
          )}
          <div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          <p className="delivery-note">Delivery cost is confirmed on WhatsApp based on your city.</p>
        </aside>
      </div>
    </section>
  );
}

function CustomPrintPage({ teams, products, selectedTeamId, onBack }) {
  const [printName, setPrintName] = useState('YOUR NAME');
  const [printNumber, setPrintNumber] = useState('10');
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: '', phone: '', city: '', note: '' });

  const team = teams.find((item) => item.id === selectedTeamId) || teams[0];
  const jersey = products.find((product) => product.teamId === team.id && product.id.endsWith('-home'));
  const jerseyImage = jerseyBackByTeam[team.id] || (jersey ? getProductImage(jersey) : '');
  const printPlacement = jerseyPrintByTeam[team.id] || {};
  const displayName = printName.trim().toUpperCase() || 'YOUR NAME';
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
      'Hello Kitline, I would like to order my Your Jersey design:',
      '',
      `Team: ${team.name}`,
      `Print name: ${displayName}`,
      `Print number: ${displayNumber}`,
      `Size: ${size}`,
      `Quantity: ${quantity}`,
      `Total: ${formatPrice(total)}`,
      '',
      `Customer name: ${customer.name}`,
      `Phone: ${customer.phone}`,
      `City: ${customer.city}`,
      customer.note ? `Note: ${customer.note}` : '',
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="custom-page">
      <button className="back-button" onClick={onBack}><Icon name="back" /> Back to shop</button>

      <div className="custom-heading">
        <p className="eyebrow">Your Jersey</p>
        <h1>Create Your Jersey.</h1>
        <p>Choose a team, enter your name and number, preview it live, then send the order by WhatsApp.</p>
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
            {jerseyImage && <img src={jerseyImage} alt={`${team.name} jersey back preview`} />}
            <div className="jersey-print-layer" aria-hidden="true">
              <span className="print-name">{displayName}</span>
              <span className="print-number">{displayNumber}</span>
            </div>
          </div>
          <div className="custom-preview-meta">
            <TeamMark team={team} small />
            <span>{team.name} Your Jersey</span>
          </div>
        </div>

        <form className="custom-form" onSubmit={submitCustomOrder}>
          <h2>Personalize Your Jersey</h2>

          <div className="custom-selected-team">
            <TeamMark team={team} small />
            <div>
              <span>Selected from sidebar</span>
              <strong>{team.name}</strong>
              <p>Use the vertical team sidebar to change the jersey preview.</p>
            </div>
          </div>

          <div className="form-grid compact">
            <label>
              Print name
              <input
                maxLength="12"
                value={printName}
                onChange={(event) => setPrintName(event.target.value)}
                placeholder="Example: AMINE"
              />
            </label>
            <label>
              Number
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
            <div className="option-heading"><strong>Select size</strong><span>Your Jersey print included</span></div>
            <div className="size-list">
              {['S', 'M', 'L', 'XL', '2XL'].map((item) => (
                <button type="button" key={item} className={size === item ? 'active' : ''} onClick={() => setSize(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="product-option custom-option">
            <strong>Quantity</strong>
            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Icon name="minus" /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Icon name="plus" /></button>
            </div>
          </div>

          <h2 className="custom-form-subtitle">Contact details</h2>
          <div className="form-grid compact">
            <label>Full name<input required name="name" value={customer.name} onChange={updateCustomer} placeholder="Your name" /></label>
            <label>WhatsApp<input required name="phone" value={customer.phone} onChange={updateCustomer} placeholder="+212 6..." /></label>
            <label>City<input required name="city" value={customer.city} onChange={updateCustomer} placeholder="Your city" /></label>
            <label>Note<input name="note" value={customer.note} onChange={updateCustomer} placeholder="Optional details" /></label>
          </div>

          <button className="whatsapp-order custom-submit" type="submit">
            <Icon name="whatsapp" /> Order Your Jersey — {formatPrice(total)}
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
  const categoryFilters = ['All', ...storeCategories.map((item) => item.name)];
  const filteredProducts = useMemo(() => storeProducts.filter((product) => {
    const matchesTeam = product.teamId === selectedTeamId;
    const matchesCategory = category === 'All' || product.category === category;
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
      setContentNotice(`Using local content because Supabase could not load: ${error.message}`);
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

  const showCheckout = () => {
    navigateView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showCustom = () => {
    navigateView('custom');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product, size = product.category === 'Jerseys' ? 'M' : product.category === 'Tattoos' ? 'One size' : '39', quantity = 1) => {
    const key = `${product.id}-${size}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      return existing
        ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { key, product, size, quantity }];
    });
    setNotice(`${product.name} added to your bag`);
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
        <button className="brand brand-button" onClick={showHome} aria-label="Kitline home">
          <span className="brand-ball">K</span>
          <span>KITLINE</span>
        </button>

        <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
          <a href="/" onClick={(event) => { event.preventDefault(); showHome(); setMenuOpen(false); }}>Home</a>
          <a href="/shop" onClick={(event) => { event.preventDefault(); showShop(); setMenuOpen(false); }}>Shop</a>
          <a href="/custom-print" onClick={(event) => { event.preventDefault(); showCustom(); setMenuOpen(false); }}>Your Jersey</a>
          <a href="/#teams" onClick={(event) => { event.preventDefault(); showHome(); setMenuOpen(false); }}>National teams</a>
          <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigateView('dashboard'); setMenuOpen(false); }}>Dashboard</a>
        </nav>

        <div className="header-actions">
          <label className="search-box">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this team"
              aria-label="Search products"
            />
          </label>
          <button className="header-icon" aria-label={`${favorites.length} favorites`}>
            <Icon name="heart" /><span>{favorites.length}</span>
          </button>
          <button className="header-icon" onClick={showCheckout} aria-label={`${cart.length} products in bag`}>
            <Icon name="bag" /><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      {view !== 'dashboard' && <aside className="team-sidebar" id="teams">
        <p className="sidebar-title">Select team</p>
        <div className="team-list">
          {storeTeams.map((team) => (
            <button
              key={team.id}
              className={`team-button ${selectedTeamId === team.id ? 'active' : ''}`}
              onClick={() => selectTeam(team.id, { stayOnCustom: view === 'custom' })}
              title={team.name}
              aria-label={`Show ${team.name} products`}
            >
              <TeamMark team={team} sidebar />
              <span className="team-tooltip">{team.name}</span>
            </button>
          ))}
        </div>
      </aside>}

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
            <p className="eyebrow">Team shop</p>
            <h1>{selectedTeam.name}<br /><em>collection.</em></h1>
            <p className="hero-description">
              Jerseys, sandals, tattoos, and fan gear in one place.
            </p>
          </div>
        </section>

        <section className="catalog-section shop-catalog" id="shop">
          <div className="section-heading">
            <div>
              <h2>{selectedTeam.name} products.</h2>
            </div>
            <p>{filteredProducts.length} products</p>
          </div>

          <div className="filter-row">
            {categoryFilters.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {item}
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
              <h3>No products found</h3>
              <p>Try a different category or search term.</p>
              <button onClick={() => { setSearch(''); setCategory('All'); }}>Reset filters</button>
            </div>
          )}
        </section>

        <section className="story-section" id="story">
          <p className="eyebrow">From the stands to the street</p>
          <h2>Your team is not just who you watch.<br />It is part of who you are.</h2>
          <div className="story-points">
            <span>Premium feel</span><span>Supporter approved</span><span>Worldwide delivery</span>
          </div>
        </section>
          </>
        )}

        {view === 'product' && selectedProduct && (
          <ProductPage
            key={selectedProduct.id}
            product={selectedProduct}
            team={storeTeams.find((team) => team.id === selectedProduct.teamId) || selectedTeam}
            liked={favorites.includes(selectedProduct.id)}
            onLike={toggleFavorite}
            onBack={productReturnView === 'home' ? showHome : showShop}
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
        <p>National colors. Everyday style.</p>
        <p>© 2026 Kitline</p>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
