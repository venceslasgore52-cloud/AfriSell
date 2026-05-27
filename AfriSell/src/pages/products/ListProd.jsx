import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Package, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { productService } from '../../services/productService';

const CATEGORIES = [
  { value: '',             label: 'Tous' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'vetements',    label: 'Vêtements' },
  { value: 'beaute',       label: 'Beauté' },
  { value: 'maison',       label: 'Maison' },
  { value: 'sante',        label: 'Santé' },
  { value: 'sport',        label: 'Sport' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'telephonie',   label: 'Téléphonie' },
  { value: 'automobile',   label: 'Automobile' },
  { value: 'agriculture',  label: 'Agriculture' },
  { value: 'services',     label: 'Services' },
  { value: 'autre',        label: 'Autre' },
];

function isActive(product) {
  // Le backend retourne statut='active'|'inactive'
  if (product.statut !== undefined) return product.statut === 'active';
  if (product.is_active !== undefined) return Boolean(product.is_active);
  return false;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function getImageUrl(product) {
  const img = product.image_url || product.image || null;
  if (!img) return null;
  if (img.startsWith('http')) return img;       // URL Cloudinary complète
  return `${API_BASE}${img}`;                   // URL relative → backend Railway
}

export default function ListProd() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [toggleError, setToggleError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    productService.list()
      .then(setProducts)
      .catch((err) => setError(err.message || 'Impossible de charger les produits.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    productService.list()
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Impossible de charger les produits.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Catégories qui ont au moins un produit dans la liste chargée
  const activeCats = [
    { value: '', label: 'Tous' },
    ...CATEGORIES.filter((cat) =>
      cat.value !== '' && products.some((p) => p.category === cat.value)
    ),
  ];

  const filtered = products.filter((p) => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat    = !category || p.category === category;
    return matchSearch && matchCat;
  });

  const toggleStatus = async (product) => {
    const currentStatut = product.statut ?? (isActive(product) ? 'active' : 'inactive');
    const newStatut     = currentStatut === 'active' ? 'inactive' : 'active';
    setToggling(product.id);
    setToggleError('');
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => p.id === product.id ? { ...p, statut: newStatut } : p)
    );
    try {
      const updated = await productService.toggleStatus(product.id, currentStatut);
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, ...updated } : p)
      );
    } catch (err) {
      // Rollback
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, statut: currentStatut } : p)
      );
      setToggleError(err.message || 'Impossible de modifier le statut.');
      setTimeout(() => setToggleError(''), 4000);
    } finally {
      setToggling(null);
    }
  };

  const confirmDelete = async (id) => {
    setDeleting(true);
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err.message || 'Impossible de supprimer ce produit.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2 md:pt-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mes produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '…' : `${products.length} produit${products.length > 1 ? 's' : ''} au total`}
          </p>
        </div>
        <Link
          to="/products/add"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition"
        >
          <Plus size={16} />
          Ajouter un produit
        </Link>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="flex items-center gap-1 text-red-600 font-semibold hover:underline text-xs">
            <RefreshCw size={12} /> Réessayer
          </button>
        </div>
      )}

      {/* Erreur toggle */}
      {toggleError && (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          {toggleError}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeCats.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                ${category === cat.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-green-600 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-700 mb-1">Aucun produit encore</p>
          <p className="text-sm text-gray-400 mb-5">Commencez par ajouter votre premier produit.</p>
          <Link
            to="/products/add"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition"
          >
            <Plus size={15} /> Ajouter un produit
          </Link>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && products.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package size={32} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium">Aucun produit correspondant</p>
          <button
            onClick={() => { setSearch(''); setCategory(''); }}
            className="mt-2 text-xs text-green-600 font-semibold hover:underline"
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Grille produits */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const active = isActive(product);
            const img    = getImageUrl(product);
            const stock  = product.quantity ?? 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative overflow-hidden">
                  {img
                    ? <img src={img} alt={product.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    : <Package size={40} className="text-gray-300" />
                  }
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold
                    ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {active ? 'Actif' : 'Inactif'}
                  </div>
                  {stock < 5 && stock >= 0 && (
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                      Stock bas
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-4">
                  <p className="text-xs text-gray-400 font-medium mb-0.5 capitalize">
                    {product.display_category || product.category || '—'}
                  </p>
                  <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-black text-green-600">
                      {Number(product.price).toLocaleString('fr-FR')} F
                    </span>
                    <span className="text-xs text-gray-400">
                      Stock :{' '}
                      <span className={`font-bold ${stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {stock}
                      </span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/products/edit/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-green-500 hover:text-green-600 transition"
                    >
                      <Edit2 size={13} /> Modifier
                    </Link>
                    <button
                      onClick={() => toggleStatus(product)}
                      disabled={toggling === product.id}
                      title={active ? 'Désactiver' : 'Activer'}
                      className={`flex items-center justify-center p-2 rounded-xl border transition
                        ${toggling === product.id ? 'opacity-50 cursor-wait' : ''}
                        ${active
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                    >
                      {toggling === product.id
                        ? <Loader2 size={16} className="animate-spin" />
                        : active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />
                      }
                    </button>
                    <button
                      onClick={() => setDeleteId(product.id)}
                      className="flex items-center justify-center p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-center font-black text-gray-900 mb-1">Supprimer ce produit ?</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
