import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyDesigns } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MyDesigns = () => {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const list = await getMyDesigns();
        setDesigns(list || []);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load designs");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-semibold mb-6">My Designs</h1>
        {loading ? (
          <div>Loading...</div>
        ) : designs.length === 0 ? (
          <div className="text-muted-foreground">No saved designs yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((d) => (
              <Card key={d._id}>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {d?.frontDesign?.previewImage ? (
                      <img src={d.frontDesign.previewImage} alt={d.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl">👕</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{d.name || d.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {d.selectedColor} • {d.selectedSize}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/customize`, { state: { loadDesignId: d._id } })}
                    >
                      Customize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyDesigns;


