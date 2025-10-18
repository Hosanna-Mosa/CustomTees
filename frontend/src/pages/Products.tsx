import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "@/lib/api";

const PRODUCTS: any[] = [];

const CATEGORIES = ["All", "T-Shirts", "Hoodies", "Sweatshirts", "Polo Shirts", "Hats"];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const filteredProducts = selectedCategory === "All" ? products : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Our Products</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Choose from our wide selection of customizable apparel
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product: any) => (
            <Card key={product.id} className="group hover-lift cursor-pointer overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.images?.[0]?.url || product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="mb-2 text-xs sm:text-sm text-muted-foreground">{product.category || 'Product'}</div>
                <h3 className="mb-2 font-semibold text-sm sm:text-base">{product.name}</h3>
                <p className="mb-2 text-xs sm:text-sm text-muted-foreground">
                  {product.sizes?.length || 0} sizes available
                </p>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2">
                  <span className="text-base sm:text-lg font-bold text-primary block sm:inline">
                    From ₹{Number(product.price).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Link to="/customize" state={{ productImage: product.images?.[0]?.url || product.image }} className="flex-1">
                      <Button size="sm" className="w-full sm:w-auto text-xs">Customize</Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 sm:flex-none text-xs"
                      onClick={() => navigate('/checkout', { state: { productId: product._id || product.id } })}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
