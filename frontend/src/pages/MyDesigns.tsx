import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyDesigns, deleteMyDesign } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Edit3 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyDesigns = () => {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDesigns = async () => {
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

  useEffect(() => {
    loadDesigns();
  }, []);

  const handleDeleteDesign = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMyDesign(id);
      setDesigns(designs.filter(d => d._id !== id));
      toast.success("Design deleted successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete design");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCustomizeDesign = (id: string) => {
    navigate(`/customize`, { state: { loadDesignId: id } });
  };

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
                      onClick={() => handleCustomizeDesign(d._id)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Customize
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === d._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Design</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this design? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDesign(d._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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


