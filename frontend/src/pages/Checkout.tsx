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
import { AddressSelector } from '@/components/AddressSelector'
import { fetchProducts, createOrder, getMe } from '@/lib/api'
import { ShoppingBag, CreditCard, Truck, Shield } from 'lucide-react'

export default function Checkout() {
  const navigate = useNavigate()
  const { state } = useLocation() as any
  const productId = state?.productId as string | undefined
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [userAddresses, setUserAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    fetchProducts().then((data) => {
      const p = (data || []).find((d: any) => (d._id || d.id) === productId)
      setProduct(p || null)
    })
  }, [productId])

  useEffect(() => {
    // Load user addresses
    getMe().then((res: any) => {
      const addresses = res.data?.addresses || []
      setUserAddresses(addresses)
      
      // Auto-select default address if available
      const defaultAddr = addresses.find((addr: any) => addr.isDefault)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id)
      }
    }).catch(() => {
      // User might not be logged in, that's okay
    })
  }, [])

  const total = useMemo(() => (product ? Number(product.price) * quantity : 0), [product, quantity])

  async function placeOrder() {
    if (!product || !selectedAddressId) return
    
    const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId)
    if (!selectedAddress) {
      setErr('Please select a valid shipping address')
      return
    }
    
    setLoading(true)
    setErr(null)
    try {
      const res = await createOrder({ 
        productId: product._id || product.id, 
        quantity, 
        paymentMethod,
        shippingAddress: selectedAddress
      })
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
      
      <div className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Complete your order securely</p>
          </div>

          {err && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{err}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            {/* Order Summary */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <img 
                        src={product.images?.[0]?.url || product.image} 
                        alt={product.name} 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quantity" className="text-xs sm:text-sm">Qty:</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                              className="w-16 sm:w-20 h-8 text-xs sm:text-sm"
                            />
                          </div>
                          <span className="font-semibold text-primary text-sm sm:text-base">₹{Number(product.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Subtotal</span>
                      <span>₹{Number(total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base sm:text-lg font-semibold">
                      <span>Total</span>
                      <span>₹{Number(total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Selection */}
              <AddressSelector 
                selectedAddressId={selectedAddressId}
                onAddressSelect={setSelectedAddressId}
              />

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
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Secure Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>• Your payment information is secure and encrypted</p>
                    <p>• Free shipping on all orders</p>
                    <p>• 30-day return policy</p>
                    <p>• 24/7 customer support</p>
                  </div>
                  
                  {!selectedAddressId && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        ⚠️ Please select a shipping address to continue
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={placeOrder} 
                    disabled={loading || !product || !selectedAddressId}
                    className="w-full h-10 sm:h-12 text-sm sm:text-lg"
                    size="lg"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/products')}
                    className="w-full h-10 sm:h-12 text-sm sm:text-base"
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


