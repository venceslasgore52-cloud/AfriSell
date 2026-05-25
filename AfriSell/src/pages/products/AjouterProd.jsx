import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Package, Loader2, AlertCircle, X } from 'lucide-react';
import AiChat from '../../components/AiChat';
import UpgradeModal from '../../components/UpgradeModal';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/useAuth';

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

const FREE_PRODUCT_LIMIT = 3;

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

const EMPTY_FORM = {
  name: '', category: '', price: '', quantity: '',
  description: '', whatsapp_template: '', image: null,
};

export default function AjouterProd() {
  const { isFree } = useAuth();
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [preview, setPreview]             = useState(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errors, setErrors]               = useState({});
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [productCount, setProductCount]   = useState(null);
  const [checkingLimit, setCheckingLimit] = useState(isFree);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isFree) return;
    productService.list()
      .then((data) => {
        const count = Array.isArray(data) ? data.length : (data.results?.length ?? 0);
        setProductCount(count);
        if (count >= FREE_PRODUCT_LIMIT) setShowUpgrade(true);
      })
      .catch(() => setProductCount(0))
      .finally(() => setCheckingLimit(false));
  }, [isFree]);

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
    if (!form.name.trim())     errs.name     = 'Le nom est obligatoire';
    if (!form.category)        errs.category = 'Choisissez une catégorie';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Prix invalide';
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Stock invalide';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFree && productCount >= FREE_PRODUCT_LIMIT) { setShowUpgrade(true); return; }

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }

    setLoading(true);
    setErrors({});
    try {
      const { whatsapp_template, ...payload } = form;
      if (whatsapp_template.trim()) payload.whatsapp_template = whatsapp_template;
      await productService.create(payload);
      navigate('/products');
    } catch (err) {
      const msg = err.message || "Impossible d'ajouter le produit.";
      setErrors({ _global: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-2 md:pt-0">
        <Link to="/products"
          className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition">
          <ArrowLeft size={17} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ajouter un produit</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations du produit</p>
        </div>

        {isFree && !checkingLimit && productCount !== null && (
          <div className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border
            ${productCount >= FREE_PRODUCT_LIMIT
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            {productCount}/{FREE_PRODUCT_LIMIT} produits gratuits
          </div>
        )}
      </div>

      {checkingLimit ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {errors._global && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 max-w-2xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errors._global}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                  <Field label="Nom du produit" required>
                    <input
                      type="text" value={form.name} onChange={set('name')}
                      className={`${INPUT_CLS} ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                      placeholder="Ex: Robe en wax imprimé"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </Field>

                  <Field label="Description" hint="Décrivez la matière, les couleurs et tailles disponibles.">
                    <textarea
                      rows={4} value={form.description} onChange={set('description')}
                      className={`${INPUT_CLS} resize-none`}
                      placeholder="Ex: Robe en wax 100% coton, disponible en bleu, rouge et vert. Tailles S à XL."
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prix (FCFA)" required>
                      <input
                        type="number" min="0" value={form.price} onChange={set('price')}
                        className={`${INPUT_CLS} ${errors.price ? 'border-red-400' : ''}`}
                        placeholder="12 000"
                      />
                      {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                    </Field>
                    <Field label="Stock disponible" required>
                      <input
                        type="number" min="0" value={form.quantity} onChange={set('quantity')}
                        className={`${INPUT_CLS} ${errors.quantity ? 'border-red-400' : ''}`}
                        placeholder="10"
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
                    Message automatique envoyé quand un client s'intéresse à ce produit.
                  </p>
                  <textarea
                    rows={3} value={form.whatsapp_template} onChange={set('whatsapp_template')}
                    className={`${INPUT_CLS} resize-none`}
                    placeholder="Ex: Bonjour ! Merci pour votre intérêt pour notre {product}. Prix : {price} FCFA. Stock : {stock} unités. Voulez-vous commander ?"
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

                {/* Aperçu carte */}
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
                      {form.quantity && (
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
                type="submit" disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {loading ? 'Enregistrement…' : 'Enregistrer le produit'}
              </button>
            </div>
          </form>
        </>
      )}

      <AiChat
        productContext={{ name: form.name, category: form.category, price: form.price, description: form.description }}
        onApplyText={(text) => setForm((prev) => ({ ...prev, description: text }))}
      />

      {showUpgrade && <UpgradeModal reason="products" onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
