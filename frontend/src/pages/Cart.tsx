import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartPreview, setCartPreview] = useState<string>("");

  useEffect(() => {
    // Load cart from localStorage
    const savedDesign = localStorage.getItem("cart-design");
    if (savedDesign) {
      setCartItems([
        {
          id: 1,
          name: "Custom T-Shirt",
          size: "M",
          color: "White",
          price: 20.99,
          quantity: 1,
        },
      ]);
    }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleRemoveItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    localStorage.removeItem("cart-design");
    toast.success("Item removed from cart");
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout...");
  };

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

      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop"
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size} | Color: {item.color}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center"
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              setCartItems(
                                cartItems.map((i) =>
                                  i.id === item.id ? { ...i, quantity: newQuantity } : i
                                )
                              );
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Order Summary</h2>

                <div className="space-y-2 border-b pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-muted-foreground">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full gradient-hero shadow-primary"
                  size="lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="rounded-lg bg-muted/50 p-4 text-sm">
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
