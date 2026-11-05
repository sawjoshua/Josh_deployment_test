import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDown, ArrowUpRight, Box, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, LayoutDashboard, LogOut, Package, Plus, Search, Settings, ShoppingBag, SlidersHorizontal, Sparkles, Tag, Trash2, TrendingUp, X } from 'lucide-react';
import './styles.css';

const API = 'https://dummyjson.com/products';
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const perPage = 10;

  async function loadProducts() {
    setLoading(true); setError('');
    try {
      const [productResponse, categoryResponse] = await Promise.all([fetch(`${API}?limit=0`), fetch(`${API}/category-list`)]);
      if (!productResponse.ok || !categoryResponse.ok) throw new Error('The catalog could not be reached. Please try again.');
      const data = await productResponse.json();
      setProducts(data.products || []); setCategories(await categoryResponse.json());
    } catch (err) { setError(err.message || 'Something went wrong while loading products.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { setPage(1); }, [category, search, sort]);
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

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="#dashboard"><span className="brand-mark">J</span><span>Josh<small>STORE ADMIN</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="admin-nav"><a className="selected" href="#dashboard"><LayoutDashboard size={17} /> Overview</a><a href="#products"><Package size={17} /> Products <span className="nav-count">{products.length}</span></a><a href="#products" onClick={() => setCategory(category === 'all' ? 'beauty' : 'all')}><Tag size={17} /> Categories</a><a href="#settings"><Settings size={17} /> Settings</a></nav>
      <div className="sidebar-bottom"><div className="sidebar-api"><span className="api-status-dot"/><span>API connected<small>DummyJSON Products</small></span></div><button className="sidebar-logout" onClick={() => setNotice('Saw Joshua is signed in to this demo dashboard')}><LogOut size={16} /> Sign out</button></div>
    </aside>
    <main className="dashboard-main" id="dashboard">
      <header className="dashboard-topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-user"><div className="topbar-avatar">SJ</div><div><strong>Saw Joshua</strong><span>Administrator</span></div><ChevronDown size={15}/></div></header>
      <div className="dashboard-content">
        <section className="welcome-row"><div><p className="dashboard-kicker">THURSDAY, NOVEMBER 5</p><h1>Good morning, Saw Joshua <span>✳</span></h1><p className="welcome-note">Here’s what’s happening with your store today.</p></div><button className="primary-action" onClick={() => setModal({ product: null })}><Plus size={17}/> Add product</button></section>
        <section className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total products</span><span className="stat-icon lavender"><Box size={17}/></span></div><strong>{products.length || '—'}</strong><small><TrendingUp size={13}/> Catalog items</small></article>
          <article className="stat-card"><div className="stat-top"><span>Categories</span><span className="stat-icon peach"><Tag size={17}/></span></div><strong>{categories.length || '—'}</strong><small><Activity size={13}/> Product groups</small></article>
          <article className="stat-card"><div className="stat-top"><span>Low stock</span><span className="stat-icon yellow"><ShoppingBag size={17}/></span></div><strong>{loading ? '—' : lowStock}</strong><small className={lowStock ? 'warning-text' : ''}><CircleAlert size={13}/> Items below 10 units</small></article>
          <article className="stat-card"><div className="stat-top"><span>Inventory value</span><span className="stat-icon green"><TrendingUp size={17}/></span></div><strong>{loading ? '—' : money(inventoryValue)}</strong><small><Box size={13}/> Retail price × stock</small></article>
        </section>
        <section className="catalog-panel" id="products">
          <div className="panel-heading"><div><h2>Product catalog</h2><p>Manage the products available in your store.</p></div><button className="secondary-action" onClick={loadProducts}><Activity size={15}/> Refresh data</button></div>
          <div className="catalog-controls"><label className="admin-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products by name or brand"/></label><label className="filter-select"><SlidersHorizontal size={15}/><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item.replaceAll('-', ' ')}</option>)}</select><ChevronDown size={14}/></label><label className="filter-select"><ArrowDown size={15}/><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Sort: featured</option><option value="name">Name</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="stock">Stock: low to high</option></select><ChevronDown size={14}/></label></div>
          {error && <div className="dashboard-error"><CircleAlert size={20}/><div><strong>Unable to load products</strong><p>{error}</p></div><button onClick={loadProducts}>Try again</button></div>}
          <div className="table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select all products"/></th><th>PRODUCT</th><th>SKU / ID</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></tr></thead><tbody>
            {loading && Array.from({length:6},(_,i)=><tr className="loading-row" key={i}><td colSpan="8"><span/></td></tr>)}
            {!loading && !error && rows.map((product) => <tr key={product.id}><td><input type="checkbox" aria-label={`Select ${product.title}`}/></td><td><div className="table-product"><img src={product.thumbnail || product.images?.[0]} alt=""/><div><strong>{product.title}</strong><span>{product.brand || 'No brand'}</span></div></div></td><td className="sku">{product.sku || `PRD-${String(product.id).padStart(4, '0')}`}</td><td><span className="category-pill">{product.category.replaceAll('-', ' ')}</span></td><td className="price-cell">{money(product.price)}</td><td>{product.stock}</td><td><span className={product.stock < 10 ? 'status low' : 'status in-stock'}><i/>{product.stock < 10 ? 'Low stock' : 'In stock'}</span></td><td><button className="row-edit" onClick={() => setModal({ product })}>Edit</button></td></tr>)}
          </tbody></table></div>
          {!loading && !error && !rows.length && <div className="no-results"><Package size={25}/><strong>No products found</strong><span>Try another search or category filter.</span></div>}
          <div className="table-footer"><span>Showing <strong>{filtered.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> products</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></button><span>Page <b>{page}</b> of {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16}/></button></div></div>
        </section>
        <div className="dashboard-footnote"><Sparkles size={14}/><span>Demo data from DummyJSON. Create, edit, and delete requests are simulated and changes reset on refresh.</span><a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">API details <ArrowUpRight size={12}/></a></div>
        <footer className="dashboard-footer" id="settings">Josh Admin <span>Dashboard for Saw Joshua</span><span>Product data by DummyJSON</span></footer>
      </div>
    </main>
    {notice && <div className="toast"><Check size={16}/>{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={14}/></button></div>}
    {modal && <ProductModal product={modal.product} onClose={() => setModal(null)} onSave={saveProduct} onDelete={deleteProduct}/>}
  </div>;
}

function ProductModal({ product, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: product?.title || '', description: product?.description || '', price: product?.price || '', category: product?.category || 'beauty', thumbnail: product?.thumbnail || '', stock: product?.stock ?? 10, brand: product?.brand || '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  function submit(event) { event.preventDefault(); onSave({ ...form, price: Number(form.price), stock: Number(form.stock) }); }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><p>{product ? 'PRODUCT DETAILS' : 'NEW LISTING'}</p><h2 id="modal-title">{product ? 'Edit product' : 'Add a product'}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button></div><form onSubmit={submit}><label>Product name<input name="title" required value={form.title} onChange={update}/></label><div className="form-row"><label>Price (USD)<input name="price" type="number" min="0" step="0.01" required value={form.price} onChange={update}/></label><label>Stock quantity<input name="stock" type="number" min="0" required value={form.stock} onChange={update}/></label></div><div className="form-row"><label>Category<input name="category" required value={form.category} onChange={update}/></label><label>Brand<input name="brand" value={form.brand} onChange={update}/></label></div><label>Image URL<input name="thumbnail" type="url" value={form.thumbnail} onChange={update} placeholder="https://…"/></label><label>Description<textarea name="description" rows="3" value={form.description} onChange={update}/></label><div className="modal-note"><Sparkles size={14}/> DummyJSON simulates writes; edits are not saved on its server.</div><div className="modal-actions">{product && (confirmDelete ? <button type="button" className="delete-button" onClick={() => onDelete(product)}><Trash2 size={15}/> Confirm delete</button> : <button type="button" className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete product</button>)}<span/><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-action">{product ? 'Save changes' : <><Plus size={16}/> Add product</>}</button></div></form></div></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
