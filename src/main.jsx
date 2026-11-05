import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, Box, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Eye, LayoutDashboard, LogOut, Minus, Package, Plus, Search, Settings, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Tag, Trash2, TrendingUp, X } from 'lucide-react';
import './styles.css';

const API = 'https://dummyjson.com/products';
const CART_API = 'https://dummyjson.com/carts';
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [carts, setCarts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [cartModal, setCartModal] = useState(null);
  const perPage = 10;

  async function loadProducts() {
    setLoading(true); setError('');
    try {
      const [productResponse, categoryResponse, cartResponse] = await Promise.all([fetch(`${API}?limit=0`), fetch(`${API}/category-list`), fetch(`${CART_API}?limit=0`)]);
      if (!productResponse.ok || !categoryResponse.ok || !cartResponse.ok) throw new Error('The store data could not be reached. Please try again.');
      const data = await productResponse.json();
      setProducts(data.products || []); setCategories(await categoryResponse.json());
      const cartData = await cartResponse.json(); setCarts(cartData.carts || []);
    } catch (err) { setError(err.message || 'Something went wrong while loading products.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { setPage(1); }, [category, search, sort]);
  useEffect(() => { setPage(1); }, [activeSection]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); } }, [notice]);

  const filtered = useMemo(() => {
    let result = products.filter((product) => {
      const term = search.trim().toLowerCase();
      return (category === 'all' || product.category === category) && (!term || `${product.title} ${product.description} ${product.category} ${product.brand || ''}`.toLowerCase().includes(term));
    });
    if (sort === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'name') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'stock') result = [...result].sort((a, b) => a.stock - b.stock);
    return result;
  }, [products, category, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const rows = filtered.slice((page - 1) * perPage, page * perPage);
  const matchedCarts = carts.filter((cart) => !search.trim() || `${cart.id} ${cart.userId}`.includes(search.trim()));
  const cartPages = Math.max(1, Math.ceil(matchedCarts.length / perPage));
  const cartRows = matchedCarts.slice((page - 1) * perPage, page * perPage);
  const lowStock = products.filter((product) => product.stock < 10).length;
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  async function saveProduct(form) {
    const editing = Boolean(modal?.product);
    try {
      const response = await fetch(editing ? `${API}/${modal.product.id}` : `${API}/add`, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('Could not save this product.');
      const returned = await response.json();
      const product = { ...(editing ? modal.product : {}), ...returned, ...form };
      setProducts((current) => editing ? current.map((item) => item.id === product.id ? product : item) : [product, ...current]);
      setModal(null); setNotice(editing ? 'Product updated for this session' : 'Product added for this session');
    } catch (err) { setNotice(err.message || 'Unable to save product'); }
  }
  async function deleteProduct(product) {
    try {
      const response = await fetch(`${API}/${product.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this product.');
      setProducts((current) => current.filter((item) => item.id !== product.id)); setModal(null); setNotice('Product removed for this session');
    } catch (err) { setNotice(err.message || 'Unable to delete product'); }
  }
  async function saveCart(form) {
    const editing = Boolean(cartModal?.cart);
    try {
      const productItems = form.items.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
        const [id, quantity = '1'] = part.split(':');
        if (!Number.isInteger(Number(id)) || Number(id) < 1 || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) throw new Error('Use product ID:quantity, for example 1:2, 5:1.');
        return { id: Number(id), quantity: Number(quantity) };
      });
      if (!productItems.length) throw new Error('Enter at least one product ID and quantity.');
      const response = await fetch(editing ? `${CART_API}/${cartModal.cart.id}` : `${CART_API}/add`, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: Number(form.userId), products: productItems }) });
      if (!response.ok) throw new Error('Could not save this cart.');
      const returned = await response.json();
      const cart = { ...(editing ? cartModal.cart : {}), ...returned, id: returned.id ?? cartModal.cart?.id, userId: Number(form.userId) };
      setCarts((current) => editing ? current.map((item) => item.id === cart.id ? cart : item) : [cart, ...current]);
      setCartModal(null); setNotice(editing ? 'Cart updated for this session' : 'Cart created for this session');
    } catch (err) { setNotice(err.message || 'Unable to save cart'); }
  }
  async function deleteCart(cart) {
    try {
      const response = await fetch(`${CART_API}/${cart.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this cart.');
      setCarts((current) => current.filter((item) => item.id !== cart.id)); setCartModal(null); setNotice('Cart removed for this session');
    } catch (err) { setNotice(err.message || 'Unable to delete cart'); }
  }

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="#dashboard"><span className="brand-mark">J</span><span>Josh<small>STORE ADMIN</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="admin-nav"><a className={activeSection === 'overview' ? 'selected' : ''} href="#dashboard" onClick={() => setActiveSection('overview')}><LayoutDashboard size={17} /> Overview</a><a className={activeSection === 'products' ? 'selected' : ''} href="#products" onClick={() => setActiveSection('products')}><Package size={17} /> Products <span className="nav-count">{products.length}</span></a><a className={activeSection === 'carts' ? 'selected' : ''} href="#carts" onClick={() => setActiveSection('carts')}><ShoppingCart size={17} /> Carts <span className="nav-count">{carts.length}</span></a><a href="#products" onClick={() => { setActiveSection('products'); setCategory(category === 'all' ? 'beauty' : 'all'); }}><Tag size={17} /> Categories</a><a href="#settings"><Settings size={17} /> Settings</a></nav>
      <div className="sidebar-bottom"><div className="sidebar-api"><span className="api-status-dot"/><span>API connected<small>DummyJSON Products</small></span></div><button className="sidebar-logout" onClick={() => setNotice('Saw Joshua is signed in to this demo dashboard')}><LogOut size={16} /> Sign out</button></div>
    </aside>
    <main className="dashboard-main" id="dashboard">
      <header className="dashboard-topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-user"><a className="view-store-link" href="/" target="_blank" rel="noreferrer">View shop <ArrowUpRight size={13}/></a><div className="topbar-avatar">SJ</div><div><strong>Saw Joshua</strong><span>Administrator</span></div><ChevronDown size={15}/></div></header>
      <div className="dashboard-content">
        <section className="welcome-row"><div><p className="dashboard-kicker">THURSDAY, NOVEMBER 5</p><h1>Good morning, Saw Joshua <span>✳</span></h1><p className="welcome-note">Here’s what’s happening with your store today.</p></div><button className="primary-action" onClick={() => activeSection === 'carts' ? setCartModal({ cart: null }) : setModal({ product: null })}><Plus size={17}/> {activeSection === 'carts' ? 'Add cart' : 'Add product'}</button></section>
        <section className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total products</span><span className="stat-icon lavender"><Box size={17}/></span></div><strong>{products.length || '—'}</strong><small><TrendingUp size={13}/> Catalog items</small></article>
          <article className="stat-card"><div className="stat-top"><span>Categories</span><span className="stat-icon peach"><Tag size={17}/></span></div><strong>{categories.length || '—'}</strong><small><Activity size={13}/> Product groups</small></article>
          <article className="stat-card"><div className="stat-top"><span>Low stock</span><span className="stat-icon yellow"><ShoppingBag size={17}/></span></div><strong>{loading ? '—' : lowStock}</strong><small className={lowStock ? 'warning-text' : ''}><CircleAlert size={13}/> Items below 10 units</small></article>
          <article className="stat-card"><div className="stat-top"><span>Inventory value</span><span className="stat-icon green"><TrendingUp size={17}/></span></div><strong>{loading ? '—' : money(inventoryValue)}</strong><small><Box size={13}/> Retail price × stock</small></article>
        </section>
        <section className="catalog-panel" id={activeSection === 'carts' ? 'carts' : 'products'}>
          <div className="panel-heading"><div><h2>{activeSection === 'carts' ? 'Shopping carts' : 'Product catalog'}</h2><p>{activeSection === 'carts' ? 'Review cart contents and the products selected by each customer.' : 'Manage the products available in your store.'}</p></div><button className="secondary-action" onClick={loadProducts}><Activity size={15}/> Refresh data</button></div>
          <div className="catalog-controls"><label className="admin-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={activeSection === 'carts' ? 'Search by cart ID or user ID' : 'Search products by name or brand'}/></label>{activeSection !== 'carts' && <><label className="filter-select"><SlidersHorizontal size={15}/><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item.replaceAll('-', ' ')}</option>)}</select><ChevronDown size={14}/></label><label className="filter-select"><ArrowDown size={15}/><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Sort: featured</option><option value="name">Name</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="stock">Stock: low to high</option></select><ChevronDown size={14}/></label></>}</div>
          {error && <div className="dashboard-error"><CircleAlert size={20}/><div><strong>Unable to load products</strong><p>{error}</p></div><button onClick={loadProducts}>Try again</button></div>}
          <div className="table-wrap"><table><thead>{activeSection === 'carts' ? <tr><th>CART</th><th>CUSTOMER</th><th>PRODUCTS</th><th>ITEMS</th><th>TOTAL</th><th>DISCOUNTED</th><th></th></tr> : <tr><th><input type="checkbox" aria-label="Select all products"/></th><th>PRODUCT</th><th>SKU / ID</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></tr>}</thead><tbody>
            {loading && Array.from({length:6},(_,i)=><tr className="loading-row" key={i}><td colSpan="8"><span/></td></tr>)}
            {!loading && !error && activeSection === 'carts' && cartRows.map((cart) => <tr key={cart.id}><td><strong className="cart-id">#{String(cart.id).padStart(3,'0')}</strong></td><td><span className="customer-id">Customer #{cart.userId}</span></td><td>{cart.totalProducts} products</td><td>{cart.totalQuantity} items</td><td className="price-cell">{money(cart.total)}</td><td>{money(cart.discountedTotal)}</td><td className="cart-row-actions"><button className="row-edit" onClick={() => setCartModal({ cart })}><Eye size={14}/> View</button><button className="row-edit" onClick={() => setCartModal({ cart, edit: true })}>Edit</button></td></tr>)}
            {!loading && !error && activeSection !== 'carts' && rows.map((product) => <tr key={product.id}><td><input type="checkbox" aria-label={`Select ${product.title}`}/></td><td><div className="table-product"><img src={product.thumbnail || product.images?.[0]} alt=""/><div><strong>{product.title}</strong><span>{product.brand || 'No brand'}</span></div></div></td><td className="sku">{product.sku || `PRD-${String(product.id).padStart(4, '0')}`}</td><td><span className="category-pill">{product.category.replaceAll('-', ' ')}</span></td><td className="price-cell">{money(product.price)}</td><td>{product.stock}</td><td><span className={product.stock < 10 ? 'status low' : 'status in-stock'}><i/>{product.stock < 10 ? 'Low stock' : 'In stock'}</span></td><td><button className="row-edit" onClick={() => setModal({ product })}>Edit</button></td></tr>)}
          </tbody></table></div>
          {!loading && !error && activeSection === 'carts' && !cartRows.length && <div className="no-results"><ShoppingCart size={25}/><strong>No carts found</strong><span>Try another cart or customer ID.</span></div>}
          {!loading && !error && activeSection !== 'carts' && !rows.length && <div className="no-results"><Package size={25}/><strong>No products found</strong><span>Try another search or category filter.</span></div>}
          <div className="table-footer"><span>Showing <strong>{activeSection === 'carts' ? (matchedCarts.length ? (page - 1) * perPage + 1 : 0) : (filtered.length ? (page - 1) * perPage + 1 : 0)}–{activeSection === 'carts' ? Math.min(page * perPage, matchedCarts.length) : Math.min(page * perPage, filtered.length)}</strong> of <strong>{activeSection === 'carts' ? matchedCarts.length : filtered.length}</strong> {activeSection === 'carts' ? 'carts' : 'products'}</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></button><span>Page <b>{page}</b> of {activeSection === 'carts' ? cartPages : pages}</span><button disabled={page === (activeSection === 'carts' ? cartPages : pages)} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16}/></button></div></div>
        </section>
        <div className="dashboard-footnote"><Sparkles size={14}/><span>Demo data from DummyJSON. Create, edit, and delete requests are simulated and changes reset on refresh.</span><a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">API details <ArrowUpRight size={12}/></a></div>
        <footer className="dashboard-footer" id="settings">Josh Admin <span>Dashboard for Saw Joshua</span><span>Product data by DummyJSON</span></footer>
      </div>
    </main>
    {notice && <div className="toast"><Check size={16}/>{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={14}/></button></div>}
    {modal && <ProductModal product={modal.product} onClose={() => setModal(null)} onSave={saveProduct} onDelete={deleteProduct}/>}
    {cartModal && <CartModal cart={cartModal.cart} edit={cartModal.edit} products={products} onClose={() => setCartModal(null)} onSave={saveCart} onDelete={deleteCart}/>}
  </div>;
}

function CustomerStorefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    Promise.all([fetch(`${API}?limit=0`), fetch(`${API}/category-list`)]).then(async ([productResponse, categoryResponse]) => {
      if (!productResponse.ok || !categoryResponse.ok) throw new Error('We could not load the collection. Please try again.');
      const data = await productResponse.json(); setProducts(data.products || []); setCategories(await categoryResponse.json());
    }).catch((err) => setError(err.message || 'Unable to connect to the product catalog.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 2400); return () => clearTimeout(timer); } }, [notice]);
  const visible = useMemo(() => {
    let list = products.filter((product) => (category === 'all' || product.category === category) && (!search.trim() || `${product.title} ${product.brand || ''} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase())));
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, category, search, sort]);
  const cartLines = Object.entries(cart).map(([id, quantity]) => ({ product: products.find((item) => item.id === Number(id)), quantity })).filter((line) => line.product);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  function changeQuantity(id, delta) { setCart((current) => { const quantity = (current[id] || 0) + delta; const next = { ...current }; if (quantity <= 0) delete next[id]; else next[id] = quantity; return next; }); }
  function checkout() { setCart({}); setCartOpen(false); setNotice('Thanks! Checkout is a demo and no order was placed.'); }

  return <div className="shop-site">
    <div className="shop-promo">A thoughtful little shop for everyday living <span>Free shipping on orders over $75</span></div>
    <header className="shop-header"><a className="shop-logo" href="/">Josh<span>®</span><small>GOOD THINGS, EVERYDAY</small></a><nav><a className="current" href="#shop">Shop</a><a href="#story">Our story</a><a href="#footer">Contact</a></nav><div className="shop-actions"><label className="shop-search"><Search size={17}/><input aria-label="Search products" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)}/></label><button className="shop-cart-button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag with ${cartCount} items`}><ShoppingBag size={19}/><span>Bag ({cartCount})</span></button><a className="shop-admin-link" href="/admin">Admin</a></div></header>
    <main>
      <section className="shop-hero"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=2200&q=85" alt="A softly lit, calm living room"/><div className="shop-hero-overlay"/><div className="shop-hero-copy"><span>THE JOSH COLLECTION</span><h1>Everyday,<br/><em>considered.</em></h1><p>Thoughtful things for the spaces you live in and the life you make there.</p><a href="#shop">Shop the collection <ArrowRight size={15}/></a></div></section>
      <section className="shop-intro" id="shop"><div><span>THE COLLECTION</span><h2>Find your everyday favourite.</h2></div><p>Small-batch essentials, made to be reached for again and again.</p></section>
      <section className="shop-catalog"><aside className="shop-categories"><h3>Categories</h3><button className={category === 'all' ? 'chosen' : ''} onClick={() => setCategory('all')}>All products</button>{categories.map((item) => <button key={item} className={category === item ? 'chosen' : ''} onClick={() => setCategory(item)}>{item.replaceAll('-', ' ')}</button>)}</aside><div className="shop-results"><div className="shop-toolbar"><span>{visible.length} pieces</span><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></label></div>{error && <div className="shop-error">{error}</div>}{loading ? <div className="shop-loading">Gathering the collection…</div> : <div className="shop-grid">{visible.map((product) => <article className="shop-product" key={product.id}><div className="shop-product-image"><img src={product.thumbnail || product.images?.[0]} alt={product.title} loading="lazy"/><span>{product.discountPercentage > 12 ? 'A good find' : product.category.replaceAll('-', ' ')}</span></div><div className="shop-product-meta">{product.brand || product.category.replaceAll('-', ' ')}</div><h3>{product.title}</h3><div className="shop-price-row"><strong>{money(product.price)}</strong><span>★ {product.rating?.toFixed(1)}</span></div><button className="add-to-bag" onClick={() => { changeQuantity(product.id, 1); setNotice(`${product.title} added to your bag`); }}>Add to bag <Plus size={14}/></button></article>)}</div>}{!loading && !error && !visible.length && <div className="shop-empty">No products found. Try another search.</div>}</div></section>
      <section className="shop-story" id="story"><span>THE JOSH WAY</span><h2>Good things, made to last.</h2><p>Useful, beautiful things for the home and the everyday. Thoughtfully chosen, always.</p></section>
    </main><footer className="shop-footer" id="footer"><a className="shop-logo" href="/">Josh<span>®</span><small>GOOD THINGS, EVERYDAY</small></a><span>Product samples provided by DummyJSON</span><a href="/admin">Admin dashboard</a></footer>
    {cartOpen && <div className="shop-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}><aside className="shop-drawer"><div className="drawer-heading"><div><span>YOUR BAG</span><h2>{cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'}` : 'A little empty'}</h2></div><button onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={20}/></button></div>{!cartLines.length ? <div className="drawer-empty"><ShoppingBag size={27}/><p>Your bag is waiting for something lovely.</p><button onClick={() => setCartOpen(false)}>Continue shopping</button></div> : <><div className="drawer-lines">{cartLines.map(({product, quantity}) => <div className="drawer-line" key={product.id}><img src={product.thumbnail} alt=""/><div className="drawer-line-info"><strong>{product.title}</strong><span>{money(product.price)}</span><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={12}/></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={12}/></button></div></div><b>{money(product.price * quantity)}</b></div>)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p>Shipping and taxes are calculated at checkout.</p><button onClick={checkout}>Continue to checkout <ArrowRight size={15}/></button></div></>}</aside></div>}
    {notice && <div className="shop-toast"><Check size={15}/>{notice}</div>}
  </div>;
}

function App() { return window.location.pathname.startsWith('/admin') ? <AdminDashboard/> : <CustomerStorefront/>; }

function ProductModal({ product, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: product?.title || '', description: product?.description || '', price: product?.price || '', category: product?.category || 'beauty', thumbnail: product?.thumbnail || '', stock: product?.stock ?? 10, brand: product?.brand || '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  function submit(event) { event.preventDefault(); onSave({ ...form, price: Number(form.price), stock: Number(form.stock) }); }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><p>{product ? 'PRODUCT DETAILS' : 'NEW LISTING'}</p><h2 id="modal-title">{product ? 'Edit product' : 'Add a product'}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button></div><form onSubmit={submit}><label>Product name<input name="title" required value={form.title} onChange={update}/></label><div className="form-row"><label>Price (USD)<input name="price" type="number" min="0" step="0.01" required value={form.price} onChange={update}/></label><label>Stock quantity<input name="stock" type="number" min="0" required value={form.stock} onChange={update}/></label></div><div className="form-row"><label>Category<input name="category" required value={form.category} onChange={update}/></label><label>Brand<input name="brand" value={form.brand} onChange={update}/></label></div><label>Image URL<input name="thumbnail" type="url" value={form.thumbnail} onChange={update} placeholder="https://…"/></label><label>Description<textarea name="description" rows="3" value={form.description} onChange={update}/></label><div className="modal-note"><Sparkles size={14}/> DummyJSON simulates writes; edits are not saved on its server.</div><div className="modal-actions">{product && (confirmDelete ? <button type="button" className="delete-button" onClick={() => onDelete(product)}><Trash2 size={15}/> Confirm delete</button> : <button type="button" className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete product</button>)}<span/><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-action">{product ? 'Save changes' : <><Plus size={16}/> Add product</>}</button></div></form></div></div>;
}

function CartModal({ cart, edit, products, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(!cart || Boolean(edit));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ userId: cart?.userId ?? 1, items: cart?.products?.map((item) => `${item.id}:${item.quantity}`).join(', ') || '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  if (!cart || editing) return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="product-modal cart-modal" role="dialog" aria-modal="true" aria-labelledby="cart-modal-title"><div className="modal-heading"><div><p>{cart ? `CART #${cart.id}` : 'NEW CART'}</p><h2 id="cart-modal-title">{cart ? 'Edit cart' : 'Create a cart'}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button></div><form onSubmit={(event) => { event.preventDefault(); onSave(form); }}><label>Customer user ID<input name="userId" type="number" min="1" required value={form.userId} onChange={update}/></label><label>Products and quantities<input name="items" required value={form.items} onChange={update} placeholder="1:2, 5:1"/><small className="field-help">Format: product ID:quantity, separated by commas. Example: 1:2, 5:1</small></label><div className="cart-product-hint"><strong>Product IDs in this catalog</strong><span>{products.slice(0, 8).map((product) => `${product.id} ${product.title}`).join(' · ')}</span></div><div className="modal-note"><Sparkles size={14}/> DummyJSON simulates cart writes; changes reset on refresh.</div><div className="modal-actions">{cart && (confirmDelete ? <button type="button" className="delete-button" onClick={() => onDelete(cart)}><Trash2 size={15}/> Confirm delete</button> : <button type="button" className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete cart</button>)}<span/><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-action">{cart ? 'Save cart' : <><Plus size={16}/> Create cart</>}</button></div></form></div></div>;
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="product-modal cart-detail-modal" role="dialog" aria-modal="true" aria-labelledby="cart-modal-title"><div className="modal-heading"><div><p>CUSTOMER #{cart.userId}</p><h2 id="cart-modal-title">Cart #{cart.id}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button></div><div className="cart-detail-items">{cart.products?.map((item) => <div className="cart-detail-item" key={item.id}><img src={item.thumbnail} alt=""/><div><strong>{item.title}</strong><span>{item.quantity} × {money(item.price)}</span></div><b>{money(item.total ?? item.price * item.quantity)}</b></div>)}</div><div className="cart-totals"><span>{cart.totalProducts} products · {cart.totalQuantity} items</span><div><span>Subtotal</span><b>{money(cart.total)}</b></div><div><span>After discount</span><b>{money(cart.discountedTotal)}</b></div></div><div className="modal-actions"><button className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete</button>{confirmDelete && <button className="delete-button" onClick={() => onDelete(cart)}>Confirm?</button>}<span/><button className="cancel-button" onClick={onClose}>Close</button><button className="primary-action" onClick={() => setEditing(true)}>Edit cart</button></div></div></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
