import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Product = { 
  _id: string
  name: string
  slug: string
  description?: string
  price: number
  stock: number
  customizable?: boolean
  customizationType?: string
  variants?: Array<{
    color: string
    colorCode: string
    images: Array<{ url: string; public_id: string }>
  }>
  createdAt: string
  updatedAt: string
}

type ProductFormData = {
  name: string
  slug: string
  description: string
  price: number
  stock: number
  customizable: boolean
  customizationType: string
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    stock: 0,
    customizable: false,
    customizationType: 'both'
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await api.getProducts()
      setProducts(res.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      stock: 0,
      customizable: false,
      customizationType: 'both'
    })
    setShowForm(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      customizable: product.customizable || false,
      customizationType: product.customizationType || 'both'
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(id)
      await api.deleteProduct(id)
      setProducts(products.filter(p => p._id !== id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData)
        setProducts(products.map(p => 
          p._id === editingProduct._id 
            ? { ...p, ...formData }
            : p
        ))
      } else {
        const res = await api.createProduct(formData)
        setProducts([res.data, ...products])
      }
      
      setShowForm(false)
      setEditingProduct(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <section>
        <h2>Products</h2>
        <div className="loading">Loading products...</div>
      </section>
    )
  }

  return (
    <section>
      <div className="section-header">
        <h2>Products</h2>
        <button className="primary" onClick={handleCreate}>
          Add Product
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <label>
                  Name *
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </label>
                
                <label>
                  Slug *
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    required
                  />
                </label>
              </div>
              
              <label>
                Description
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </label>
              
              <div className="form-row">
                <label>
                  Price (₹) *
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    required
                    min="0"
                    step="0.01"
                  />
                </label>
                
                <label>
                  Stock *
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    required
                    min="0"
                  />
                </label>
              </div>
              
              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.customizable}
                    onChange={(e) => setFormData({...formData, customizable: e.target.checked})}
                  />
                  Customizable
                </label>
                
                {formData.customizable && (
                  <label>
                    Customization Type
                    <select
                      value={formData.customizationType}
                      onChange={(e) => setFormData({...formData, customizationType: e.target.value})}
                    >
                      <option value="predefined">Predefined Only</option>
                      <option value="own">User Own Design</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                )}
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="secondary">
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products found</p>
          <button className="primary" onClick={handleCreate}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-actions">
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(product)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(product._id)}
                    disabled={deleting === product._id}
                    title="Delete"
                  >
                    {deleting === product._id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
              
              <div className="product-details">
                <div className="detail-row">
                  <span className="label">Slug:</span>
                  <span className="value">{product.slug}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">Price:</span>
                  <span className="value">₹{product.price.toFixed(2)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">Stock:</span>
                  <span className="value">{product.stock}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">Customizable:</span>
                  <span className="value">{product.customizable ? 'Yes' : 'No'}</span>
                </div>
                
                {product.customizable && (
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{product.customizationType}</span>
                  </div>
                )}
                
                {product.variants && product.variants.length > 0 && (
                  <div className="detail-row">
                    <span className="label">Colors:</span>
                    <span className="value">{product.variants.length} variants</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}


