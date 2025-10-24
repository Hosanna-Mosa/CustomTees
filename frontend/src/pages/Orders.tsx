import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { myOrders } from '@/lib/api'
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusConfig = {
  placed: { label: 'Placed', icon: Package, color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    myOrders()
      .then(setOrders)
      .catch((e) => setError(e.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-4 lg:py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/products')}
              className="mb-4 text-sm lg:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Track and manage your orders</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-3 lg:p-4">
                <p className="text-red-600 text-sm lg:text-base">{error}</p>
              </CardContent>
            </Card>
          )}

          {orders.length === 0 && !error ? (
            <Card className="text-center py-8 lg:py-12">
              <CardContent>
                <ShoppingBag className="h-12 w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg lg:text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6 text-sm lg:text-base">Start shopping to see your orders here</p>
                <Button onClick={() => navigate('/products')} className="text-sm lg:text-base">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              {orders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.placed
                const StatusIcon = statusInfo.icon
                
                return (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                          <Package className="h-4 w-4 lg:h-5 lg:w-5" />
                          Order #{order._id.slice(-8)}
                        </CardTitle>
                        <Badge className={statusInfo.color} className="w-fit">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 lg:p-6">
                      {order.items?.map((item: any, index: number) => {
                        // Debug: Log the item structure to understand the data
                        console.log('Order item:', item);
                        console.log('Custom design:', item.customDesign);
                        console.log('Product:', item.product);
                        
                        // For cart-based orders, use custom design preview, otherwise use product image
                        // Check both possible structures: customDesign (from order) and direct frontDesign (from cart)
                        const imageSrc = item.customDesign?.frontDesign?.previewImage || 
                                       item.customDesign?.backDesign?.previewImage ||
                                       item.frontDesign?.previewImage ||
                                       item.backDesign?.previewImage ||
                                       item.product?.images?.[0]?.url || 
                                       item.product?.image;
                        
                        console.log('Image source:', imageSrc);
                        console.log('Image source length:', imageSrc?.length);
                        console.log('Image source type:', typeof imageSrc);
                        
                        return (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 lg:p-4 bg-muted/50 rounded-lg">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 mx-auto sm:mx-0">
                              {imageSrc ? (
                                <img 
                                  src={imageSrc} 
                                  alt={item.product?.name || 'Custom Design'} 
                                  className="w-full h-full object-cover rounded-lg"
                                  onLoad={() => console.log('Image loaded successfully')}
                                  onError={(e) => {
                                    console.log('Image failed to load:', e);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-muted rounded-lg flex items-center justify-center ${imageSrc ? 'hidden' : ''}`}>
                                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                              <h4 className="font-semibold text-sm lg:text-base">{item.product?.name || 'Custom Product'}</h4>
                              <p className="text-xs lg:text-sm text-muted-foreground">
                                {(item.customDesign || item.frontDesign || item.backDesign) ? (
                                  <>
                                    Size: {item.customDesign?.selectedSize || 'N/A'} | Color: {item.customDesign?.selectedColor || 'N/A'}
                                    {(item.customDesign?.frontDesign || item.frontDesign) && <span> | Front Design</span>}
                                    {(item.customDesign?.backDesign || item.backDesign) && <span> | Back Design</span>}
                                  </>
                                ) : (
                                  item.product?.description
                                )}
                              </p>
                              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 text-xs lg:text-sm">
                                <span>Qty: {item.quantity}</span>
                                <span className="font-semibold text-primary">₹{Number(item.price).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      <Separator />
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs lg:text-sm text-muted-foreground">
                            Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                          </div>
                          <div className="text-xs lg:text-sm text-muted-foreground break-all">
                            Order ID: {order._id}
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="text-base lg:text-lg font-bold text-primary">
                            ₹{Number(order.total).toFixed(2)}
                          </div>
                          <div className="text-xs lg:text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}


