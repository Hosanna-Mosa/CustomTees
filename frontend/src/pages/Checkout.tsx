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
import { createOrderFromCart, getMe } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/hooks/use-auth'
import { ShoppingBag, CreditCard, Truck, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, loading: cartLoading } = useCart()
  const { isAuthenticated } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [userAddresses, setUserAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (cartItems.length === 0) {
      navigate('/cart')
      return
    }
  }, [isAuthenticated, cartItems.length, navigate])

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

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
  }, [cartItems])

  async function placeOrder() {
    if (cartItems.length === 0 || !selectedAddressId) return
    
    const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId)
    if (!selectedAddress) {
      setErr('Please select a valid shipping address')
      return
    }
    
    setLoading(true)
    setErr(null)
    try {
      const res = await createOrderFromCart({ 
        paymentMethod,
        shippingAddress: selectedAddress
      })
      const order = (res as any).data || res
      
      toast.success('Order placed successfully!')
      
      if (paymentMethod === 'razorpay') {
        navigate('/payments', { state: { orderId: order._id, total } })
      } else {
        navigate('/orders')
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to place order')
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto p-6 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Your Cart is Empty</h2>
              <p className="text-muted-foreground mb-4">Add some items to your cart to proceed with checkout.</p>
              <Button onClick={() => navigate('/cart')}>View Cart</Button>
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
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                        {item.frontDesign?.previewImage ? (
                          <img 
                            src={item.frontDesign.previewImage} 
                            alt={item.productName} 
                            className="w-full h-full object-cover rounded-lg" 
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                            No Preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base">{item.productName}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Size: {item.selectedSize} | Color: {item.selectedColor}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Base: ₹{item.basePrice.toFixed(2)}
                          {item.frontCustomizationCost > 0 && (
                            <span> | Front: ₹{item.frontCustomizationCost.toFixed(2)}</span>
                          )}
                          {item.backCustomizationCost > 0 && (
                            <span> | Back: ₹{item.backCustomizationCost.toFixed(2)}</span>
                          )}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs sm:text-sm">Qty: {item.quantity}</Label>
                          </div>
                          <span className="font-semibold text-primary text-sm sm:text-base">
                            ₹{(item.totalPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
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
                    disabled={loading || cartItems.length === 0 || !selectedAddressId}
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


