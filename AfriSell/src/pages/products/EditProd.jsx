import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Package, Loader2, AlertCircle, X } from 'lucide-react';
import { productService } from '../../services/productService';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition';

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'vetements',    label: 'Vêtements' },
  { value: 'beaute',       label: 'Beauté & Cosmétiques' },
  { value: 'maison',       label: 'Maison & Décoration' },
  { value: 'sante',        label: 'Santé & Bien-être' },
  { value: 'sport',        label: 'Sport & Loisirs' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'telephonie',   label: 'Téléphonie' },
  { value: 'automobile',   label: 'Automobile' },
  { value: 'agriculture',  label: 'Agriculture' },
  { value: 'services',     label: 'Services' },
  { value: 'autre',        label: 'Autre' },
];

export default function EditProd() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    productService.get(id)
      .then((product) => {
        setForm({
          name:               product.name        || '',
          category:           product.category    || '',
          price:              product.price        || '',
          quantity:           product.quantity ?? product.stock ?? '',
          description:        product.description || '',
          whatsapp_template:  product.whatsapp_template || '',
          image:              null,
        });
        const img = product.image_url || product.image || null;
        if (img) setPreview(img);
      })
      .catch((err) => setErrors({ _global: err.message || 'Produit introuvable.' }))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const applyImage = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image trop lourde (max 5 Mo)' }));
      return;
    }
    setForm((prev) => ({ ...prev, image: file }));
    setPreview(URL.createObjectURL(file));
    setErrors((prev) => { const n = { ...prev }; delete n.image; return n; });
  }, []);

  const handleImage = (e) => applyImage(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyImage(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setPreview(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())                               errs.name     = 'Le nom est obligatoire';
    if (!form.category)                                  errs.category = 'Choisissez une catégorie';
    if (!form.price || Number(form.price) <= 0)          errs.price    = 'Prix invalide';
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Stock invalide';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const { whatsapp_template, ...payload } = form;
      if (whatsapp_template.trim()) payload.whatsapp_template = whatsapp_template;
      await productService.update(id, payload);
      navigate('/products');
    } catch (err) {
      setErrors({ _global: err.message || 'Impossible de modifier le produit.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-2 md:pt-0">
        <Link to="/products"
          className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition">
          <ArrowLeft size={17} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Modifier le produit</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mettez à jour les informations</p>
        </div>
      </div>

      {errors._global && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 max-w-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errors._global}</span>
        </div>
      )}

      {form && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <Field label="Nom du produit" required>
                  <input
                    type="text" value={form.name} onChange={set('name')}
                    className={`${INPUT_CLS} ${errors.name ? 'border-red-400' : ''}`}
                    placeholder="Ex: Robe en wax imprimé"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </Field>

                <Field label="Description" hint="Décrivez la matière, les couleurs et tailles disponibles.">
                  <textarea
                    rows={4} value={form.description} onChange={set('description')}
                    className={`${INPUT_CLS} resize-none`}
                    placeholder="Décrivez votre produit…"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prix (FCFA)" required>
                    <input
                      type="number" min="0" value={form.price} onChange={set('price')}
                      className={`${INPUT_CLS} ${errors.price ? 'border-red-400' : ''}`}
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                  </Field>
                  <Field label="Stock disponible" required>
                    <input
                      type="number" min="0" value={form.quantity} onChange={set('quantity')}
                      className={`${INPUT_CLS} ${errors.quantity ? 'border-red-400' : ''}`}
                    />
                    {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                  </Field>
                </div>

                <Field label="Catégorie" required>
                  <select
                    value={form.category} onChange={set('category')}
                    className={`${INPUT_CLS} ${errors.category ? 'border-red-400' : ''}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                </Field>
              </div>

              {/* Message bot */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-1">Message bot WhatsApp</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Message automatique envoyé aux clients intéressés.
                </p>
                <textarea
                  rows={3} value={form.whatsapp_template} onChange={set('whatsapp_template')}
                  className={`${INPUT_CLS} resize-none`}
                  placeholder="Ex: Bonjour ! {product} disponible à {price} FCFA. Stock : {stock} unités."
                />
                <p className="text-xs text-gray-400 mt-2">
                  Variables :{' '}
                  {['{product}', '{price}', '{stock}'].map((v) => (
                    <code key={v} className="bg-gray-100 px-1 rounded mx-0.5">{v}</code>
                  ))}
                </p>
              </div>
            </div>

            {/* Colonne photo */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Photo du produit</h3>

                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="preview"
                      className="w-full aspect-square object-cover rounded-xl" />
                    <button
                      type="button" onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition"
                    >
                      <X size={13} />
                    </button>
                    <label className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-green-600 cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                      <Upload size={12} /> Changer l'image
                    </label>
                  </div>
                ) : (
                  <label
                    className={`block cursor-pointer ${isDragging ? 'opacity-80' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                    <div className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center gap-3 transition
                      ${isDragging ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-400'}`}>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload size={22} className="text-gray-400" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-semibold text-gray-700">Glisser ou cliquer</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · max 5 Mo</p>
                      </div>
                    </div>
                  </label>
                )}
                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
              </div>

              {/* Aperçu */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Aperçu</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {preview
                      ? <img src={preview} alt="" className="w-full h-full object-cover" />
                      : <Package size={20} className="text-gray-300" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {form.name || 'Nom du produit'}
                    </p>
                    <p className="text-green-600 font-black text-sm">
                      {form.price ? `${Number(form.price).toLocaleString('fr-FR')} F` : '—'}
                    </p>
                    {form.quantity !== '' && (
                      <p className="text-xs text-gray-400">Stock : {form.quantity}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl flex justify-end gap-3 mt-6">
            <Link to="/products"
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Annuler
            </Link>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
