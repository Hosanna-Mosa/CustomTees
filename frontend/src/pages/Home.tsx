import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Truck, Clock, Shield, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Home() {
  const benefits = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "2-Week Delivery on all orders",
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Rush options available",
    },
    {
      icon: Shield,
      title: "100% Satisfaction",
      description: "Money-back guarantee",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Coordinator",
      content: "Amazing quality and fast delivery! Our team t-shirts turned out perfect.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Business Owner",
      content: "The design tool is so easy to use. Created professional merch in minutes.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Fundraiser Organizer",
      content: "Great customer service and the final products exceeded expectations!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-12 sm:py-20 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl xl:text-6xl">
                  Connect With{" "}
                  <span className="text-primary">Custom T-Shirts</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
                  Add your company logo to custom t-shirts and promo products. 
                  Fast, easy, and affordable.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/customize">
                  <Button size="lg" className="gradient-hero shadow-primary hover:shadow-lg transition-all w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Products
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 sm:pt-8 border-t">
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">10M+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Support</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">100%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative order-first lg:order-last">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"
                  alt="Custom t-shirts"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -right-2 sm:-right-4 top-4 sm:top-8 rounded-xl bg-background p-3 sm:p-4 shadow-lg border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                  <div>
                    <div className="font-bold text-sm sm:text-base">4.9/5</div>
                    <div className="text-xs text-muted-foreground">50k+ Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y bg-primary/5 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{benefit.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold">Popular Products</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose from our wide selection of customizable apparel
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {["T-Shirts", "Hoodies", "Polo Shirts", "Hats"].map((product, index) => (
              <Card key={index} className="group hover-lift cursor-pointer overflow-hidden">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={`https://images.unsplash.com/photo-${
                      index === 0 ? "1521572163474" :
                      index === 1 ? "1556821011-f6b8af2ab3" :
                      index === 2 ? "1596755094514" : "1588850561407"
                    }-6864f9cf17ab?w=400&h=400&fit=crop`}
                    alt={product}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base">{product}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">From $12.99</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/products">
              <Button variant="outline" size="lg">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold">What Our Customers Say</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-lift">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4 flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base text-foreground/80">{testimonial.content}</p>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-6 sm:p-12 text-center">
              <h2 className="mb-4 text-2xl sm:text-3xl font-bold">Ready to Design Your Custom T-Shirts?</h2>
              <p className="mb-6 sm:mb-8 text-base sm:text-lg opacity-90">
                Start creating your perfect design in minutes with our easy-to-use design tool.
              </p>
              <Link to="/customize">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Start Designing Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
