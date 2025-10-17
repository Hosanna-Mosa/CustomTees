import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { fetchProducts } from "@/lib/api";

const PRODUCTS: any[] = [];

const CATEGORIES = ["All", "T-Shirts", "Hoodies", "Sweatshirts", "Polo Shirts", "Hats"];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const filteredProducts = selectedCategory === "All" ? products : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Our Products</h1>
          <p className="text-lg text-muted-foreground">
            Choose from our wide selection of customizable apparel
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product: any) => (
            <Card key={product.id} className="group hover-lift cursor-pointer overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.images?.[0]?.url || product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 text-sm text-muted-foreground">{product.category || 'Product'}</div>
                <h3 className="mb-2 font-semibold">{product.name}</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  {product.sizes?.length || 0} sizes available
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    From ₹{Number(product.price).toFixed(2)}
                  </span>
                  <Link to="/customize" state={{ productImage: product.images?.[0]?.url || product.image }}>
                    <Button size="sm">Customize</Button>
                  </Link>
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
