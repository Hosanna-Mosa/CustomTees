import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CreditCard, CheckCircle, ArrowLeft, Shield, Clock } from 'lucide-react'

export default function Payments() {
  const { state } = useLocation() as any
  const navigate = useNavigate()
  const { orderId, total, product } = state || {}
  
  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto p-6 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Invalid Payment Session</h2>
              <p className="text-muted-foreground mb-4">No payment session found.</p>
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/checkout')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Checkout
            </Button>
            <h1 className="text-3xl font-bold mb-2">Payment</h1>
            <p className="text-muted-foreground">Complete your secure payment</p>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <img 
                    src={product?.images?.[0]?.url || product?.image} 
                    alt={product?.name} 
                    className="w-16 h-16 object-cover rounded-lg" 
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product?.name}</h3>
                    <p className="text-sm text-muted-foreground">{product?.description}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Order ID</span>
                    <Badge variant="outline">{orderId.slice(-8)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Item Price</span>
                    <span>₹{Number(total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{Number(total).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Razorpay Test Mode</span>
                    <Badge variant="secondary">Test</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a test payment. Use test card numbers for testing.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>Test Card: 4111 1111 1111 1111</p>
                    <p>CVV: Any 3 digits | Expiry: Any future date</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Instant payment processing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/orders')}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Simulate Payment Success
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/checkout')}
                className="w-full"
              >
                Cancel Payment
              </Button>
            </div>

            {/* Security Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Secure Payment</h4>
                    <p className="text-sm text-green-700">
                      Your payment is processed securely through Razorpay. We never store your card details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}


