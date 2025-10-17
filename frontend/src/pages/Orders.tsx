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
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/products')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {orders.length === 0 && !error ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                <Button onClick={() => navigate('/products')}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.placed
                const StatusIcon = statusInfo.icon
                
                return (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Order #{order._id.slice(-8)}
                        </CardTitle>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                          <img 
                            src={item.product?.images?.[0]?.url || item.product?.image} 
                            alt={item.product?.name} 
                            className="w-16 h-16 object-cover rounded-lg" 
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.product?.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.product?.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Qty: {item.quantity}</span>
                              <span className="font-semibold text-primary">₹{Number(item.price).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order ID: {order._id}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            ₹{Number(order.total).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total</div>
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


