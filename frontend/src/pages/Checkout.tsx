import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { fetchProducts, createOrder } from '@/lib/api'
import { ShoppingBag, CreditCard, Truck, Shield } from 'lucide-react'

export default function Checkout() {
  const navigate = useNavigate()
  const { state } = useLocation() as any
  const productId = state?.productId as string | undefined
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    fetchProducts().then((data) => {
      const p = (data || []).find((d: any) => (d._id || d.id) === productId)
      setProduct(p || null)
    })
  }, [productId])

  const total = useMemo(() => (product ? Number(product.price) * quantity : 0), [product, quantity])

  async function placeOrder() {
    if (!product) return
    setLoading(true)
    setErr(null)
    try {
      const res = await createOrder({ productId: product._id || product.id, quantity, paymentMethod })
      const order = (res as any).data || res
      if (paymentMethod === 'razorpay') {
        navigate('/payments', { state: { orderId: order._id, total, product } })
      } else {
        navigate('/orders')
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (!productId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto p-6 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Invalid Checkout</h2>
              <p className="text-muted-foreground mb-4">No product selected for checkout.</p>
              <Button onClick={() => navigate('/products')}>Browse Products</Button>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your order securely</p>
          </div>

          {err && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{err}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={product.images?.[0]?.url || product.image} 
                        alt={product.name} 
                        className="w-20 h-20 object-cover rounded-lg" 
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quantity">Qty:</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                          <span className="font-semibold text-primary">₹{Number(product.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{Number(total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>₹{Number(total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cod' | 'razorpay')}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                        <Truck className="h-4 w-4" />
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Razorpay (Test Mode)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Secure Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Your payment information is secure and encrypted</p>
                    <p>• Free shipping on all orders</p>
                    <p>• 30-day return policy</p>
                    <p>• 24/7 customer support</p>
                  </div>
                  
                  <Button 
                    onClick={placeOrder} 
                    disabled={loading || !product}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/products')}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}


