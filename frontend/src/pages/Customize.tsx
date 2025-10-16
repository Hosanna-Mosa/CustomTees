import { useState, useEffect, useRef } from "react";
import { Canvas as FabricCanvas, FabricImage, FabricText, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Upload,
  Type,
  Trash2,
  RotateCw,
  Download,
  ShoppingCart,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";

const TSHIRT_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#FCD34D" },
  { name: "Pink", value: "#EC4899" },
  { name: "Purple", value: "#A855F7" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FONTS = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"];

export default function Customize() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedColor, setSelectedColor] = useState(TSHIRT_COLORS[0].value);
  const [selectedSize, setSelectedSize] = useState("M");
  const [basePrice] = useState(15.99);
  const [customizationCost, setCustomizationCost] = useState(0);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(40);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const totalPrice = basePrice + customizationCost;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 500,
      height: 600,
      backgroundColor: "#f5f5f5",
    });

    setFabricCanvas(canvas);

    // Add T-shirt base
    addTShirtBase(canvas, selectedColor);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (fabricCanvas) {
      updateTShirtColor(fabricCanvas, selectedColor);
    }
  }, [selectedColor, fabricCanvas]);

  const addTShirtBase = (canvas: FabricCanvas, color: string) => {
    const tshirtSvg = `
      <svg width="400" height="500" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 80 L50 480 L350 480 L350 80 L320 50 L280 70 L280 30 L120 30 L120 70 L80 50 Z" 
              fill="${color}" stroke="#ccc" stroke-width="2"/>
        <circle cx="200" cy="150" r="100" fill="${color}" opacity="0.3"/>
      </svg>
    `;
    
    const blob = new Blob([tshirtSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    FabricImage.fromURL(url).then((img) => {
      img.set({
        left: 50,
        top: 50,
        selectable: false,
        evented: false,
      });
      (img as any).name = "tshirt-base";
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });
  };

  const updateTShirtColor = (canvas: FabricCanvas, color: string) => {
    const objects = canvas.getObjects();
    const tshirtBase = objects.find((obj) => (obj as any).name === "tshirt-base");
    
    if (tshirtBase) {
      canvas.remove(tshirtBase);
    }
    
    addTShirtBase(canvas, color);
  };

  const handleAddText = () => {
    if (!fabricCanvas) return;

    const text = new FabricText("Your Text Here", {
      left: 200,
      top: 250,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: selectedFont,
    });
    (text as any).name = "custom-text";

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    
    updateCustomizationCost();
    toast.success("Text added! Drag to reposition.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      
      FabricImage.fromURL(imgUrl).then((img) => {
        img.scale(0.3);
        img.set({
          left: 200,
          top: 250,
        });
        (img as any).name = "custom-image";
        
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        
        updateCustomizationCost();
        toast.success("Image uploaded! Drag to reposition.");
      });
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && (activeObject as any).name !== "tshirt-base") {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      updateCustomizationCost();
      toast.success("Element deleted!");
    }
  };

  const handleRotate = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 15);
      fabricCanvas.renderAll();
    }
  };

  const handleReset = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => {
      if ((obj as any).name !== "tshirt-base") {
        fabricCanvas.remove(obj);
      }
    });
    
    fabricCanvas.renderAll();
    setCustomizationCost(0);
    toast.success("Design reset!");
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement("a");
    link.download = "custom-tshirt.png";
    link.href = dataURL;
    link.click();
    
    toast.success("Design downloaded!");
  };

  const handleAddToCart = () => {
    if (!fabricCanvas) return;
    
    const designData = fabricCanvas.toJSON();
    localStorage.setItem("cart-design", JSON.stringify(designData));
    
    toast.success("Added to cart!");
  };

  const updateCustomizationCost = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    const customObjects = objects.filter((obj) => (obj as any).name !== "tshirt-base");
    
    // $5 per customization element
    setCustomizationCost(customObjects.length * 5);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="mb-8 text-3xl font-bold">Design Your Custom T-Shirt</h1>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr_300px]">
          {/* Left Sidebar - Product Options */}
          <Card className="h-fit">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="mb-3 block text-base font-semibold">T-Shirt Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TSHIRT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`h-12 w-12 rounded-lg border-2 transition-all hover:scale-110 ${
                        selectedColor === color.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-base font-semibold">Size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="w-full"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customization:</span>
                    <span className="font-medium">${customizationCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center - Canvas */}
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-muted/30 p-4 shadow-lg">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset Design
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Customization Tools */}
          <Card className="h-fit">
            <CardContent className="p-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Type className="mr-2 h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Upload className="mr-2 h-4 w-4" />
                    Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 pt-4">
                  <div>
                    <Label className="mb-2 block">Font</Label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      {FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Font Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(value) => setFontSize(value[0])}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Text Color</Label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="h-10 w-full rounded-md border-2 border-border"
                        style={{ backgroundColor: textColor }}
                      />
                      {showColorPicker && (
                        <div className="rounded-lg border p-3">
                          <HexColorPicker color={textColor} onChange={setTextColor} />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleAddText} className="w-full">
                    <Type className="mr-2 h-4 w-4" />
                    Add Text
                  </Button>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 pt-4">
                  <div>
                    <Label className="mb-2 block">Upload Image</Label>
                    <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        Click to upload your logo or design
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="font-medium">Tips:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>Use PNG files for best quality</li>
                      <li>Transparent backgrounds work best</li>
                      <li>Drag to reposition after upload</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-3 border-t pt-6">
                <Button onClick={handleAddToCart} className="w-full gradient-hero shadow-primary">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Free shipping on orders over $50
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
