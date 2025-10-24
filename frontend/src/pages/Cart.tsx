import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { cartItems, loading, updateItemQuantity, removeItemFromCart, clearCartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleRemoveItem = (itemId: string) => {
    removeItemFromCart(itemId);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex-1">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="mb-2 text-2xl font-bold">Your Cart is Empty</h1>
            <p className="mb-6 text-muted-foreground">
              Start designing your custom t-shirt to add items to your cart!
            </p>
            <Button asChild>
              <a href="/customize">Start Designing</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-4 lg:py-8 flex-1">
        <h1 className="mb-6 lg:mb-8 text-2xl lg:text-3xl font-bold">Shopping Cart</h1>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-muted mx-auto sm:mx-0">
                      {item.frontDesign?.previewImage ? (
                        <img
                          src={item.frontDesign.previewImage}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                          No Preview
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between space-y-4">
                      <div className="text-center sm:text-left">
                        <h3 className="text-base lg:text-lg font-semibold">{item.productName}</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          Size: {item.selectedSize} | Color: {item.selectedColor}
                        </p>
                        <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                          Base Price: ₹{item.basePrice.toFixed(2)}
                          {item.frontCustomizationCost > 0 && (
                            <span> | Front Design: ₹{item.frontCustomizationCost.toFixed(2)}</span>
                          )}
                          {item.backCustomizationCost > 0 && (
                            <span> | Back Design: ₹{item.backCustomizationCost.toFixed(2)}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <label className="text-xs lg:text-sm font-medium">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            disabled={loading}
                            className="w-12 lg:w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-xs lg:text-sm disabled:opacity-50"
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              updateItemQuantity(item._id, newQuantity);
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-base lg:text-lg font-bold">
                            ₹{(item.totalPrice * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={loading}
                            onClick={() => handleRemoveItem(item._id)}
                            className="h-8 w-8 lg:h-10 lg:w-10"
                          >
                            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 lg:top-24">
              <CardContent className="p-4 lg:p-6 space-y-4">
                <h2 className="text-lg lg:text-xl font-bold">Order Summary</h2>

                <div className="space-y-2 border-b pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-muted-foreground">
                      Add ₹{(50 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-base lg:text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full gradient-hero shadow-primary text-sm lg:text-base"
                  size="lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="rounded-lg bg-muted/50 p-3 lg:p-4 text-xs lg:text-sm">
                  <p className="font-medium">Secure Checkout</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your payment information is encrypted and secure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
