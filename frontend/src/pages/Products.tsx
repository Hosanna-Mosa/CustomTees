import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    id: 1,
    name: "Classic T-Shirt",
    category: "T-Shirts",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    colors: 12,
  },
  {
    id: 2,
    name: "Premium Hoodie",
    category: "Hoodies",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1556821011-f6b8af2ab384?w=400&h=400&fit=crop",
    colors: 8,
  },
  {
    id: 3,
    name: "Polo Shirt",
    category: "Polo Shirts",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
    colors: 10,
  },
  {
    id: 4,
    name: "Baseball Cap",
    category: "Hats",
    price: 16.99,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
    colors: 6,
  },
  {
    id: 5,
    name: "Crew Neck Sweatshirt",
    category: "Sweatshirts",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=400&fit=crop",
    colors: 9,
  },
  {
    id: 6,
    name: "Tank Top",
    category: "T-Shirts",
    price: 14.99,
    image: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&h=400&fit=crop",
    colors: 8,
  },
  {
    id: 7,
    name: "Zip Hoodie",
    category: "Hoodies",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
    colors: 7,
  },
  {
    id: 8,
    name: "Beanie",
    category: "Hats",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop",
    colors: 12,
  },
];

const CATEGORIES = ["All", "T-Shirts", "Hoodies", "Sweatshirts", "Polo Shirts", "Hats"];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts =
    selectedCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((product) => product.category === selectedCategory);

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
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover-lift cursor-pointer overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 text-sm text-muted-foreground">{product.category}</div>
                <h3 className="mb-2 font-semibold">{product.name}</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  {product.colors} colors available
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    From ${product.price.toFixed(2)}
                  </span>
                  <Link to="/customize">
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
