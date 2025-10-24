import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Order = { 
  _id: string; 
  total?: number; 
  status?: string; 
  user?: any; 
  items?: any[];
  shippingAddress?: any;
  paymentMethod?: string;
  createdAt?: string;
}

type OrderDetails = Order & {
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: {
      name: string;
      slug: string;
      price: number;
      variants: any[];
    };
    quantity: number;
    price: number;
    customDesign?: {
      frontDesign?: {
        previewImage?: string;
      };
      backDesign?: {
        previewImage?: string;
      };
      selectedColor?: string;
      selectedSize?: string;
    };
  }>;
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
  const [loadingOrder, setLoadingOrder] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    api.getOrders()
      .then((res) => setOrders(res.data))
      .catch((e) => setError(e.message))
  }, [])

  async function updateStatus(id: string, status: string) {
    try {
      setSaving(id)
      await api.updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
    } catch (e) {
      setError('Failed to update status')
    } finally {
      setSaving(null)
    }
  }

  async function handleOrderClick(orderId: string) {
    try {
      setLoadingOrder(orderId)
      const response = await api.getOrderById(orderId)
      setSelectedOrder(response.data)
    } catch (e) {
      setError('Failed to load order details')
    } finally {
      setLoadingOrder(null)
    }
  }

  function closeOrderDialog() {
    setSelectedOrder(null)
    setZoomedImage(null)
  }

  function openImageZoom(imageUrl: string) {
    setZoomedImage(imageUrl)
  }

  function closeImageZoom() {
    setZoomedImage(null)
  }

  return (
    <section>
      <h2>Orders</h2>
      {error && <div className="error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} style={{ cursor: 'pointer' }} onClick={() => handleOrderClick(o._id)}>
              <td>
                {o._id.slice(-6)}
                {loadingOrder === o._id && <span className="loading-spinner" style={{ marginLeft: '8px' }}></span>}
              </td>
              <td>{o.user?.name || '—'}</td>
              <td>₹{((o.total || 0) / 100).toFixed(2)}</td>
              <td>{o.status}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <select disabled={saving === o._id} value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                  <option value="placed">placed</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && !error && <div>No orders yet</div>}

      {/* Order Details Dialog */}
      {selectedOrder && selectedOrder.user && (
        <div className="modal-overlay" onClick={closeOrderDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder._id.slice(-6)}</h3>
              <button className="close-btn" onClick={closeOrderDialog}>×</button>
            </div>
            
            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Design Previews Section */}
              {selectedOrder.items?.some(item => item.customDesign?.frontDesign?.previewImage || item.customDesign?.backDesign?.previewImage) && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>
                    Design Previews
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                    gap: '24px',
                    marginBottom: '20px'
                  }}>
                    {selectedOrder.items?.map((item, itemIndex) => (
                      item.customDesign && (item.customDesign.frontDesign?.previewImage || item.customDesign.backDesign?.previewImage) && (
                        <div key={itemIndex} className="design-preview-card">
                          <div className="design-preview-header">
                            <h5 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>
                              {item.product?.name || 'Unknown Product'}
                            </h5>
                            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                              {item.customDesign.selectedColor} • {item.customDesign.selectedSize}
                            </div>
                          </div>
                          
                          <div className="design-preview-grid">
                            {item.customDesign.frontDesign?.previewImage && (
                              <div className="design-preview-item">
                                <div className="design-preview-label">Front Design</div>
                                <div className="design-preview-container" onClick={() => openImageZoom(item.customDesign.frontDesign.previewImage)}>
                                  <img 
                                    src={item.customDesign.frontDesign.previewImage} 
                                    alt="Front Design" 
                                    className="design-preview-image"
                                  />
                                  <div className="zoom-overlay">
                                    <span className="zoom-icon">🔍</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {item.customDesign.backDesign?.previewImage && (
                              <div className="design-preview-item">
                                <div className="design-preview-label">Back Design</div>
                                <div className="design-preview-container" onClick={() => openImageZoom(item.customDesign.backDesign.previewImage)}>
                                  <img 
                                    src={item.customDesign.backDesign.previewImage} 
                                    alt="Back Design" 
                                    className="design-preview-image"
                                  />
                                  <div className="zoom-overlay">
                                    <span className="zoom-icon">🔍</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Show placeholder if only one design exists */}
                            {item.customDesign.frontDesign?.previewImage && !item.customDesign.backDesign?.previewImage && (
                              <div className="design-preview-item">
                                <div className="design-preview-label">Back Design</div>
                                <div className="design-preview-container" style={{ background: 'var(--panel)', border: '2px dashed var(--border)' }}>
                                  <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>
                                    No back design
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!item.customDesign.frontDesign?.previewImage && item.customDesign.backDesign?.previewImage && (
                              <div className="design-preview-item">
                                <div className="design-preview-label">Front Design</div>
                                <div className="design-preview-container" style={{ background: 'var(--panel)', border: '2px dashed var(--border)' }}>
                                  <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>
                                    No front design
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Customer Information</h4>
                <div className="card">
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedOrder.user?.name || 'Unknown User'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{selectedOrder.user?.email || 'No email'}</span>
                  </div>
                  {selectedOrder.user?.phone && (
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span className="value">{selectedOrder.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Order Information</h4>
                <div className="card">
                  <div className="detail-row">
                    <span className="label">Order ID:</span>
                    <span className="value">{selectedOrder._id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="value">{selectedOrder.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total:</span>
                    <span className="value">₹{((selectedOrder.total || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Payment Method:</span>
                    <span className="value">{selectedOrder.paymentMethod?.toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Order Date:</span>
                    <span className="value">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Shipping Address</h4>
                  <div className="card">
                    <div className="detail-row">
                      <span className="label">Name:</span>
                      <span className="value">{selectedOrder.shippingAddress.fullName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span className="value">{selectedOrder.shippingAddress.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Address:</span>
                      <span className="value">
                        {selectedOrder.shippingAddress.line1}
                        {selectedOrder.shippingAddress.line2 && `, ${selectedOrder.shippingAddress.line2}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">City:</span>
                      <span className="value">{selectedOrder.shippingAddress.city}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">State:</span>
                      <span className="value">{selectedOrder.shippingAddress.state}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Postal Code:</span>
                      <span className="value">{selectedOrder.shippingAddress.postalCode}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Country:</span>
                      <span className="value">{selectedOrder.shippingAddress.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Order Items</h4>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="card" style={{ marginBottom: '12px' }}>
                    <div className="detail-row">
                      <span className="label">Product:</span>
                      <span className="value">{item.product?.name || 'Unknown Product'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{item.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Price:</span>
                      <span className="value">₹{(item.price / 100).toFixed(2)}</span>
                    </div>
                    
                    {/* Custom Design Information */}
                    {item.customDesign && (
                      <>
                        <div className="detail-row">
                          <span className="label">Color:</span>
                          <span className="value">{item.customDesign.selectedColor}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Size:</span>
                          <span className="value">{item.customDesign.selectedSize}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="modal-overlay" onClick={closeImageZoom} style={{ zIndex: 2000 }}>
          <div className="image-zoom-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeImageZoom} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 2001 }}>×</button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Design" 
              className="zoomed-image"
            />
          </div>
        </div>
      )}
    </section>
  )
}


