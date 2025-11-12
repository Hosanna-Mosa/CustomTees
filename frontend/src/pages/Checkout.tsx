import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AddressSelector } from '@/components/AddressSelector'
import { createOrderFromCart, getMe, getActiveCoupons, applyCoupon } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/hooks/use-auth'
import { ShoppingBag, CreditCard, Truck, Shield, Tag, X } from 'lucide-react'
import { toast } from 'sonner'

type AppliedCoupon = {
  code: string
  description?: string
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
}

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, loading: cartLoading } = useCart()
  const { isAuthenticated } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [userAddresses, setUserAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const couponInputRef = useRef<HTMLInputElement>(null)

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
      
      // Auto-select default address if available; otherwise if there is exactly one address, select it
      const defaultAddr = addresses.find((addr: any) => addr.isDefault)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id)
      } else if (addresses.length === 1) {
        setSelectedAddressId(addresses[0]._id)
      }
    }).catch(() => {
      // User might not be logged in, that's okay
    })

    // Load active coupons
    getActiveCoupons().then((coupons) => {
      setAvailableCoupons(coupons || [])
    }).catch(() => {
      // Ignore errors, coupons are optional
    })
  }, [])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
  }, [cartItems])

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  const handleApplyCoupon = async (code?: string) => {
    // If code is provided (from clicking a coupon), use it directly
    // Otherwise, get the current value from the input ref or state
    let codeToApply = code
    
    if (!codeToApply) {
      // Try to get from ref first (most current value)
      if (couponInputRef.current) {
        codeToApply = couponInputRef.current.value?.trim().toUpperCase() || ''
      }
      // Fallback to state if ref doesn't have value
      if (!codeToApply) {
        codeToApply = couponCode.trim().toUpperCase()
      }
    } else {
      // Ensure code from parameter is uppercase
      codeToApply = codeToApply.trim().toUpperCase()
    }
    
    if (!codeToApply) {
      toast.error('Please enter a coupon code')
      return
    }

    setApplyingCoupon(true)
    setErr(null)
    try {
      const result = await applyCoupon(codeToApply, subtotal)
      // Only store essential coupon data to avoid circular references
      setAppliedCoupon({
        code: result.coupon?.code || codeToApply,
        description: result.coupon?.description || '',
        discountType: result.coupon?.discountType,
        discountValue: result.coupon?.discountValue,
      })
      setDiscountAmount(result.discountAmount)
      setCouponCode('')
      toast.success(`Coupon "${result.coupon.code}" applied! Discount: ₹${result.discountAmount.toFixed(2)}`)
    } catch (e: any) {
      const errorMessage = typeof e === 'object' && e !== null && 'message' in e 
        ? String(e.message) 
        : 'Invalid coupon code'
      toast.error(errorMessage)
      setAppliedCoupon(null)
      setDiscountAmount(0)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponCode('')
    toast.success('Coupon removed')
  }

  // Re-apply coupon when subtotal changes
  useEffect(() => {
    if (appliedCoupon?.code && subtotal > 0) {
      const couponCode = appliedCoupon.code
      applyCoupon(couponCode, subtotal)
        .then((result) => {
          setDiscountAmount(result.discountAmount)
          // Update coupon data if needed, but only store essential fields
          if (result.coupon) {
            setAppliedCoupon({
              code: result.coupon.code || couponCode,
              description: result.coupon.description || appliedCoupon.description || '',
              discountType: result.coupon.discountType,
              discountValue: result.coupon.discountValue,
            })
          }
        })
        .catch(() => {
          // If coupon becomes invalid, remove it
          setAppliedCoupon(null)
          setDiscountAmount(0)
          setCouponCode('')
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, appliedCoupon?.code])

  async function placeOrder() {
    if (cartItems.length === 0 || !selectedAddressId) return
    
    // Try to find the selected address from our cached list; if missing (e.g., just added), refetch once
    let selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId)
    if (!selectedAddress) {
      try {
        const res = await getMe()
        const refreshedAddresses = (res as any).data?.addresses || []
        setUserAddresses(refreshedAddresses)
        selectedAddress = refreshedAddresses.find((addr: any) => addr._id === selectedAddressId) || null
      } catch (_) {
        // ignore, we'll handle error below
      }
    }
    if (!selectedAddress) {
      setErr('Please select a valid shipping address')
      return
    }
    
    setLoading(true)
    setErr(null)
    try {
      const res = await createOrderFromCart({ 
        paymentMethod,
        shippingAddress: selectedAddress,
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountAmount > 0 ? discountAmount : null
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Checkout</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Complete your order securely</p>
          </div>

          {err && (
            <Card className="mb-4 sm:mb-6 border-2 border-red-200 bg-red-50/50">
              <CardContent className="p-3 sm:p-4">
                <p className="text-sm sm:text-base text-red-600">{err}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row lg:gap-6 xl:gap-8">
            {/* Left Column - Order Details */}
            <div className="flex-1 space-y-4 sm:space-y-5 md:space-y-6">
              {/* Coupon Section */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Coupon Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {appliedCoupon ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-green-800 text-sm sm:text-base">
                            Coupon Applied: {appliedCoupon.code}
                          </p>
                          <p className="text-xs sm:text-sm text-green-700 mt-1">
                            Discount: <span className="font-semibold">₹{discountAmount.toFixed(2)}</span>
                            {appliedCoupon.description && ` - ${appliedCoupon.description}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-green-700 hover:text-green-800 hover:bg-green-200/50 h-8 w-8 p-0 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableCoupons.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 font-semibold">Available Coupons:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableCoupons.map((coupon) => (
                              <div
                                key={coupon._id}
                                className="p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-muted transition-all duration-200 border border-muted-foreground/10 hover:border-primary/30"
                                onClick={() => handleApplyCoupon(coupon.code)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-foreground">{coupon.code}</span>
                                  <span className="text-primary font-semibold">
                                    {coupon.discountType === 'percentage'
                                      ? `${coupon.discountValue}% OFF`
                                      : `₹${coupon.discountValue} OFF`}
                                  </span>
                                </div>
                                {coupon.description && (
                                  <p className="text-muted-foreground mt-1 text-xs">{coupon.description}</p>
                                )}
                                {coupon.minPurchase > 0 && (
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    Min. purchase: ₹{coupon.minPurchase}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all">
                      <div className="w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted/50 shadow-md">
                        {item.frontDesign?.previewImage ? (
                          <img 
                            src={item.frontDesign.previewImage} 
                            alt={item.productName} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                            No Preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <h3 className="font-bold text-sm sm:text-base mb-1.5 line-clamp-2">{item.productName}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            Size: {item.selectedSize}
                          </span>
                          <span className="px-2 py-0.5 bg-secondary/50 rounded-full text-xs">
                            {item.selectedColor}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5 mb-2">
                          <p>
                            Base: <span className="font-medium text-foreground">₹{item.basePrice.toFixed(2)}</span>
                          </p>
                          {item.frontCustomizationCost > 0 && (
                            <p>
                              Front: <span className="font-medium text-foreground">₹{item.frontCustomizationCost.toFixed(2)}</span>
                            </p>
                          )}
                          {item.backCustomizationCost > 0 && (
                            <p>
                              Back: <span className="font-medium text-foreground">₹{item.backCustomizationCost.toFixed(2)}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                          <Label className="text-xs sm:text-sm text-muted-foreground">
                            Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                          </Label>
                          <span className="font-bold text-primary text-base sm:text-lg">
                            ₹{(item.totalPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">₹{Number(subtotal).toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm sm:text-base text-green-600">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="font-semibold">-₹{Number(discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-base sm:text-lg font-bold text-foreground">Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-primary">
                        ₹{Number(total).toFixed(2)}
                      </span>
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
              <Card className="border-2 shadow-lg">
                <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cod' | 'razorpay')}>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base font-medium">Cash on Delivery</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer mt-3">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base font-medium">Razorpay (Test Mode)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Actions */}
            <div className="lg:w-80 xl:w-96 lg:sticky lg:top-24 lg:self-start mt-4 lg:mt-0">
              <Card className="border-2 shadow-xl">
                <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Secure Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <p>Your payment information is secure and encrypted</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <p>Free shipping on all orders</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <p>30-day return policy</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <p>24/7 customer support</p>
                    </div>
                  </div>
                  
                  {!selectedAddressId && (
                    <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-xs sm:text-sm text-amber-700 font-medium">
                        ⚠️ Please select a shipping address to continue
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={placeOrder} 
                    disabled={loading || cartItems.length === 0 || !selectedAddressId}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gradient-hero shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/products')}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base border-2"
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


