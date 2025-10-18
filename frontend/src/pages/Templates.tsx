import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Palette, Shirt, Star } from 'lucide-react';
import { fetchProducts } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  rating: number;
  tags: string[];
  description: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    'all',
    'business',
    'casual',
    'sports',
    'vintage',
    'minimalist',
    'artistic',
    'humor',
    'custom'
  ];

  const sampleTemplates: Template[] = [
    {
      id: '1',
      name: 'Classic Business Logo',
      category: 'business',
      image: '/placeholder.svg',
      price: 299,
      rating: 4.8,
      tags: ['professional', 'corporate', 'clean'],
      description: 'Clean and professional design perfect for business attire'
    },
    {
      id: '2',
      name: 'Vintage Band Tee',
      category: 'vintage',
      image: '/placeholder.svg',
      price: 399,
      rating: 4.6,
      tags: ['retro', 'music', 'grunge'],
      description: 'Retro-inspired design with vintage band aesthetics'
    },
    {
      id: '3',
      name: 'Minimalist Quote',
      category: 'minimalist',
      image: '/placeholder.svg',
      price: 199,
      rating: 4.9,
      tags: ['simple', 'typography', 'inspirational'],
      description: 'Simple typography design with inspirational quotes'
    },
    {
      id: '4',
      name: 'Sports Team Pride',
      category: 'sports',
      image: '/placeholder.svg',
      price: 349,
      rating: 4.7,
      tags: ['team', 'sports', 'pride'],
      description: 'Show your team spirit with this dynamic sports design'
    },
    {
      id: '5',
      name: 'Artistic Abstract',
      category: 'artistic',
      image: '/placeholder.svg',
      price: 449,
      rating: 4.5,
      tags: ['abstract', 'art', 'creative'],
      description: 'Unique abstract design for creative individuals'
    },
    {
      id: '6',
      name: 'Funny Meme Design',
      category: 'humor',
      image: '/placeholder.svg',
      price: 249,
      rating: 4.8,
      tags: ['funny', 'meme', 'humor'],
      description: 'Light-hearted design that brings smiles'
    }
  ];

  useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates(sampleTemplates);
      setFilteredTemplates(sampleTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [searchTerm, selectedCategory, templates]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Design Templates</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose from our collection of professionally designed templates or create your own
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize text-xs sm:text-sm"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing {filteredTemplates.length} of {templates.length} templates
            </p>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Palette className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }} size="sm">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                          ₹{template.price}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-sm sm:text-base mb-1">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {renderStars(template.rating)}
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({template.rating})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="flex-1 text-xs sm:text-sm" size="sm">
                        <Shirt className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Use Template
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Custom Design CTA */}
          <div className="mt-8 sm:mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6 sm:p-8 text-center">
                <Palette className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Don't see what you're looking for?</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Create your own custom design with our easy-to-use design tool
                </p>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-sm sm:text-base">
                  <Palette className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start Custom Design
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
