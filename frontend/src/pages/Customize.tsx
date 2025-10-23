import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, FabricText } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocation } from "react-router-dom";
import {
  Upload,
  Type,
  Trash2,
  RotateCw,
  Download,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProducts, fetchProductBySlug, saveMyDesign, getMyDesignById } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

// Types
type Step = "category" | "product" | "design";

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sizes: string[];
  variants: Array<{
    color: string;
    colorCode: string;
    images: Array<{ url: string; public_id: string }>;
  }>;
  customizable: boolean;
  customizationType: "predefined" | "own" | "both";
  designTemplate?: any;
  customizationPricing?: {
    perTextLayer: number;
    perImageLayer: number;
    sizeMultiplier: number;
  };
}

interface DesignLayer {
  id: string;
  type: "text" | "image";
  data: {
    content?: string;
    font?: string;
    color?: string;
    size?: number;
    url?: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  cost: number;
}

const CATEGORIES: Category[] = [
  { id: "tshirts", name: "T-Shirts", icon: "👕" },
  { id: "hoodies", name: "Hoodies", icon: "🧥" },
  { id: "tanks", name: "Tank Tops", icon: "🎽" },
  { id: "polo", name: "Polo Shirts", icon: "👔" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FONTS = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"];
// Dynamic pricing: cost derived from rendered object area (in pixels)
const PRICE_PER_PIXEL = 0.02; // ₹ per pixel area

export default function Customize() {
  const { addItemToCart } = useCart();
  const location = useLocation() as any;
  // Step management
  const [step, setStep] = useState<Step>("category");
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");
  
  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  
  // Design state
  const [designSide, setDesignSide] = useState<"front" | "back">("front");
  const [frontDesignLayers, setFrontDesignLayers] = useState<DesignLayer[]>([]);
  const [backDesignLayers, setBackDesignLayers] = useState<DesignLayer[]>([]);
  
  // Use refs to store latest layer state to avoid stale closures
  const frontDesignLayersRef = useRef<DesignLayer[]>([]);
  const backDesignLayersRef = useRef<DesignLayer[]>([]);
  const previousDesignSideRef = useRef<"front" | "back">("front");
  
  // Keep refs in sync with state
  useEffect(() => {
    frontDesignLayersRef.current = frontDesignLayers;
  }, [frontDesignLayers]);
  
  useEffect(() => {
    backDesignLayersRef.current = backDesignLayers;
  }, [backDesignLayers]);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(40);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showBackground, setShowBackground] = useState(false);
  const [transparentBgEnabled, setTransparentBgEnabled] = useState(false);
  const [transparentColor] = useState<string>("#ffffff");
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  // Load design by id from navigation state; also fetch product so images load
  useEffect(() => {
    const id = (location as any)?.state?.loadDesignId as string | undefined;
    if (!id) return;
    (async () => {
      try {
        const d = await getMyDesignById(id);
        if (!d) return;
        setSelectedSize(d.selectedSize || "M");
        setSelectedColor(d.selectedColor || null);
        if (d.productSlug) {
          try {
            const prod = await fetchProductBySlug(d.productSlug);
            setSelectedProduct(prod);
          } catch {}
        }
        if (d.frontDesign?.designLayers) setFrontDesignLayers(d.frontDesign.designLayers);
        if (d.backDesign?.designLayers) setBackDesignLayers(d.backDesign.designLayers);
        setStep("design");
        toast.success("Loaded saved design");
      } catch (e) {
        toast.error("Failed to load saved design");
      }
    })();
  }, [location]);

  // Current design layers based on selected side
  const designLayers = designSide === "front" ? frontDesignLayers : backDesignLayers;
  const setDesignLayers = designSide === "front" ? setFrontDesignLayers : setBackDesignLayers;
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Pricing
  const basePrice = selectedProduct?.price || 0;
  const [frontCustomizationCost, setFrontCustomizationCost] = useState(0);
  const [backCustomizationCost, setBackCustomizationCost] = useState(0);
  const totalPrice = basePrice + frontCustomizationCost + backCustomizationCost;

  // Update total price when base price changes
  useEffect(() => {
    // Reset customization costs when base price changes
    setFrontCustomizationCost(0);
    setBackCustomizationCost(0);
  }, [basePrice]);
  // Helper: initialize Fabric canvas
  const setupCanvasInstance = useCallback((el: HTMLCanvasElement) => {
    if (didInitCanvasRef.current || fabricCanvas) return;
    const canvas = new FabricCanvas(el, {
      width: 500,
      height: 600,
      backgroundColor: "transparent",
    });
    setFabricCanvas(canvas);
    didInitCanvasRef.current = true;

    if (showBackground) {
      addBackgroundPhoto(canvas);
    }
    if (selectedProduct && selectedColor) {
      const variant = selectedProduct.variants.find((v) => v.color === selectedColor);
      const imgUrl = variant ? pickVariantImageForSide(variant, designSide) : undefined;
      if (imgUrl) {
        // eslint-disable-next-line no-console
        console.log("[Customize] Loading base image for", designSide, ":", imgUrl);
        addProductPhotoBase(canvas, imgUrl);
      } else {
        // eslint-disable-next-line no-console
        console.warn("[Customize] No image found for", designSide, "side");
      }
    }

    const getObjectArea = (obj: any) => {
      // Use absolute values to handle negative scaling
      const scaleX = Math.abs(obj.scaleX || 1);
      const scaleY = Math.abs(obj.scaleY || 1);
      
      // For text objects, use the actual bounding box
      if (obj.type === 'text' || obj.type === 'textbox') {
        const bbox = obj.getBoundingRect();
        return bbox.width * bbox.height;
      }
      
      // For other objects, use width/height with absolute scaling
      const width = (obj.width || 0) * scaleX;
      const height = (obj.height || 0) * scaleY;
      return width * height;
    };

  }, [selectedColor, selectedProduct, showBackground, step]);

  // Canvas element ref
  const canvasElRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    if (el) {
      if (step === "design") {
        setupCanvasInstance(el);
      }
    }
  }, [setupCanvasInstance, step]);


  // Focused logging for front/back switching
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[Customize] Side changed to:", designSide);
  }, [designSide]);

  // Initialize canvas only when in design step (layout effect for earlier timing)
  const didInitCanvasRef = useRef(false);
  useLayoutEffect(() => {
    if (step !== "design" || !canvasRef.current) return;
    if (didInitCanvasRef.current && fabricCanvas) {
      return;
    }
    setupCanvasInstance(canvasRef.current);

    return () => {
      if (fabricCanvas) {
        fabricCanvas.off("object:modified");
        fabricCanvas.off("object:scaling");
        fabricCanvas.off("object:moving");
        fabricCanvas.off("object:rotating");
        fabricCanvas.dispose();
      }
      didInitCanvasRef.current = false;
    };
  }, [step, selectedProduct, selectedColor, designSide, setupCanvasInstance]);

  // Switch base image when changing sides
  useEffect(() => {
    if (!fabricCanvas || step !== "design") return;
    
    // eslint-disable-next-line no-console
    console.log("[Customize] Side switching to:", designSide);
    
    // Store current canvas state from the PREVIOUS side before switching
    const storeCurrentCanvasState = () => {
      const objects = fabricCanvas.getObjects();
      const previousSide = previousDesignSideRef.current;
      const currentLayers = previousSide === "front" ? frontDesignLayersRef.current : backDesignLayersRef.current;
      const updatedLayers = [...currentLayers];
      
      // Update layer positions from current canvas objects
      objects.forEach((obj: any) => {
        if (obj.layerId && (obj.name === "custom-text" || obj.name === "custom-image")) {
          const layerIndex = updatedLayers.findIndex(layer => layer.id === obj.layerId);
          if (layerIndex !== -1) {
            updatedLayers[layerIndex] = {
              ...updatedLayers[layerIndex],
              data: {
                ...updatedLayers[layerIndex].data,
                x: obj.left || 0,
                y: obj.top || 0,
                rotation: obj.angle || 0,
                scale: obj.scaleX || 1,
                size: obj.fontSize || updatedLayers[layerIndex].data.size,
                color: obj.fill || updatedLayers[layerIndex].data.color,
                font: obj.fontFamily || updatedLayers[layerIndex].data.font,
              }
            };
          }
        }
      });
      
      // Update the appropriate state for the PREVIOUS side
      if (previousSide === "front") {
        setFrontDesignLayers(updatedLayers);
      } else {
        setBackDesignLayers(updatedLayers);
      }
      
      return updatedLayers;
    };
    
    // Only store state if we're actually switching sides (not initial load)
    if (previousDesignSideRef.current !== designSide) {
      const currentStoredLayers = storeCurrentCanvasState();
    }
    
    // Update the previous side ref for next time
    previousDesignSideRef.current = designSide;
    
    // Clear canvas
    fabricCanvas.clear();
    
    // Add background if enabled
    if (showBackground) {
      addBackgroundPhoto(fabricCanvas);
    }
    
    // Replace base image according to side
    if (selectedProduct && selectedColor) {
      const variant = selectedProduct.variants.find((v) => v.color === selectedColor);
      const imgUrl = variant ? pickVariantImageForSide(variant, designSide) : undefined;
      if (imgUrl) {
        // eslint-disable-next-line no-console
        console.log("[Customize] Loading", designSide, "image:", imgUrl);
        
        // Add new base image and wait for it to load before proceeding
        FabricImage.fromURL(imgUrl, { crossOrigin: "anonymous" })
          .then((img) => {
            // eslint-disable-next-line no-console
            console.log("[Customize] Base image loaded successfully for", designSide, "Dimensions:", img.width, "x", img.height);
            img.set({ selectable: false, evented: false });
            
            // Cover entire canvas area for full width/height
            const canvasW = 500;
            const canvasH = 600;
            const scaleX = canvasW / (img.width || canvasW);
            const scaleY = canvasH / (img.height || canvasH);
            const scale = Math.max(scaleX, scaleY);
            img.scale(scale);
            const newW = (img.width || 0) * scale;
            const newH = (img.height || 0) * scale;
            const left = (canvasW - newW) / 2;
            const top = (canvasH - newH) / 2;
            img.set({ left, top });
            
            // eslint-disable-next-line no-console
            console.log("[Customize] Image positioning - Scale:", scale, "Size:", newW, "x", newH, "Position:", left, ",", top);
            (img as any).name = "tshirt-base-photo";
            fabricCanvas.add(img);
            
            // Send to back but above background
            fabricCanvas.sendObjectToBack(img);
            const bg = fabricCanvas.getObjects().find((o) => (o as any).name === "bg-photo");
            if (bg) {
              fabricCanvas.sendObjectToBack(bg);
            }
            
            // Now reload design layers for the NEW side with EXACT positions
            const targetLayers = designSide === "front" ? frontDesignLayersRef.current : backDesignLayersRef.current;
            // eslint-disable-next-line no-console
            console.log("[Customize] Loading", targetLayers.length, "design elements for", designSide);
            
            // Add each layer with exact positioning
            targetLayers.forEach((layer) => {
              if (layer.type === "text") {
                const text = new FabricText(layer.data.content || "", {
                  left: layer.data.x,
                  top: layer.data.y,
                  fontSize: layer.data.size,
                  fill: layer.data.color,
                  fontFamily: layer.data.font,
                  angle: layer.data.rotation,
                  scaleX: layer.data.scale,
                  scaleY: layer.data.scale,
                });
                (text as any).name = "custom-text";
                (text as any).layerId = layer.id;
                fabricCanvas.add(text);
                // eslint-disable-next-line no-console
                console.log("[Customize] Added text:", layer.data.content, "at position:", layer.data.x, layer.data.y);
              } else if (layer.type === "image" && layer.data.url) {
                FabricImage.fromURL(layer.data.url).then((img) => {
                  img.set({
                    left: layer.data.x,
                    top: layer.data.y,
                    angle: layer.data.rotation,
                    scaleX: layer.data.scale,
                    scaleY: layer.data.scale,
                  });
                  (img as any).name = "custom-image";
                  (img as any).layerId = layer.id;
                  fabricCanvas.add(img);
                  fabricCanvas.renderAll();
                  // eslint-disable-next-line no-console
                  console.log("[Customize] Added image at position:", layer.data.x, layer.data.y);
                });
              }
            });
            
            fabricCanvas.renderAll();
            // eslint-disable-next-line no-console
            console.log("[Customize] Canvas rendered after adding", designSide, "image and layers");
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error("[Customize] Failed to load base image for", designSide, ":", err);
            toast.error("Failed to load product image");
          });
      } else {
        // eslint-disable-next-line no-console
        console.warn("[Customize] No", designSide, "image available");
      }
    }
  }, [designSide, fabricCanvas, step, selectedProduct, selectedColor, showBackground]);

  // Toggle background photo on/off
  useEffect(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    const bg = objects.find((o) => (o as any).name === "bg-photo");
    if (showBackground && !bg) {
      addBackgroundPhoto(fabricCanvas);
      (fabricCanvas as any).backgroundColor = "#f5f5f5";
      fabricCanvas.renderAll();
    } else if (!showBackground && bg) {
      fabricCanvas.remove(bg);
      (fabricCanvas as any).backgroundColor = "transparent";
      fabricCanvas.renderAll();
    }
  }, [showBackground, fabricCanvas]);

  // Live update active text styling
  useEffect(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (active && (active as any).name === "custom-text") {
      (active as any).set({ fontSize, fill: textColor, fontFamily: selectedFont });
      fabricCanvas.requestRenderAll();
    }
  }, [fontSize, textColor, selectedFont, fabricCanvas]);

  // Continuous position sync - update layer positions when objects move
  useEffect(() => {
    if (!fabricCanvas) return;

    const updateLayerPositions = () => {
      const objects = fabricCanvas.getObjects();
      const currentLayers = designSide === "front" ? frontDesignLayersRef.current : backDesignLayersRef.current;
      const updatedLayers = [...currentLayers];
      let hasChanges = false;

      objects.forEach((obj: any) => {
        if (obj.layerId && (obj.name === "custom-text" || obj.name === "custom-image")) {
          const layerIndex = updatedLayers.findIndex(layer => layer.id === obj.layerId);
          if (layerIndex !== -1) {
            const currentLayer = updatedLayers[layerIndex];
            const newData = {
              ...currentLayer.data,
              x: obj.left || 0,
              y: obj.top || 0,
              rotation: obj.angle || 0,
              scale: obj.scaleX || 1,
              size: obj.fontSize || currentLayer.data.size,
              color: obj.fill || currentLayer.data.color,
              font: obj.fontFamily || currentLayer.data.font,
            };

            // Check if position actually changed
            if (
              currentLayer.data.x !== newData.x ||
              currentLayer.data.y !== newData.y ||
              currentLayer.data.rotation !== newData.rotation ||
              currentLayer.data.scale !== newData.scale
            ) {
              updatedLayers[layerIndex] = {
                ...currentLayer,
                data: newData
              };
              hasChanges = true;
            }
          }
        }
      });

      // Only update state if there are actual changes
      if (hasChanges) {
        if (designSide === "front") {
          setFrontDesignLayers(updatedLayers);
        } else {
          setBackDesignLayers(updatedLayers);
        }
      }
    };

    // Debounced update to prevent too many rapid updates
    let updateTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateLayerPositions, 100);
    };

    // Add event listeners for object changes
    fabricCanvas.on("object:modified", debouncedUpdate);
    fabricCanvas.on("object:moving", debouncedUpdate);
    fabricCanvas.on("object:scaling", debouncedUpdate);
    fabricCanvas.on("object:rotating", debouncedUpdate);

    // Cleanup
    return () => {
      clearTimeout(updateTimeout);
      fabricCanvas.off("object:modified", debouncedUpdate);
      fabricCanvas.off("object:moving", debouncedUpdate);
      fabricCanvas.off("object:scaling", debouncedUpdate);
      fabricCanvas.off("object:rotating", debouncedUpdate);
    };
  }, [fabricCanvas, designSide]);

  // Handle canvas object selection
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const handleObjectSelection = () => {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject && (activeObject as any).name === "custom-text") {
        // Populate text input with selected text content
        setTextInput((activeObject as any).text || "");
        setFontSize((activeObject as any).fontSize || 40);
        setTextColor((activeObject as any).fill || "#000000");
        setSelectedFont((activeObject as any).fontFamily || "Arial");
      } else {
        // Clear text input when no text is selected
        setTextInput("");
      }
    };

    fabricCanvas.on("selection:created", handleObjectSelection);
    fabricCanvas.on("selection:updated", handleObjectSelection);
    fabricCanvas.on("selection:cleared", () => {
      setTextInput("");
    });

    return () => {
      fabricCanvas.off("selection:created", handleObjectSelection);
      fabricCanvas.off("selection:updated", handleObjectSelection);
      fabricCanvas.off("selection:cleared");
    };
  }, [fabricCanvas]);

  // Dynamic pricing updates on canvas object changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const calculateTotalPrice = () => {
      const objects = fabricCanvas.getObjects();
      let totalArea = 0;

      // Get current layers for the active side
      const currentLayers = designSide === "front" ? frontDesignLayers : backDesignLayers;

      objects.forEach((obj) => {
        // Skip background and base images
        if (!obj.selectable || (obj as any).name === "tshirt-base" || (obj as any).name === "tshirt-base-photo" || (obj as any).name === "bg-photo") {
          return;
        }

        // Only calculate area for objects that belong to the current side
        const layerId = (obj as any).layerId;
        const belongsToCurrentSide = currentLayers.some(layer => layer.id === layerId);
        
        if (!belongsToCurrentSide) {
          return;
        }

        // Calculate area using absolute scaling
        const scaleX = Math.abs(obj.scaleX || 1);
        const scaleY = Math.abs(obj.scaleY || 1);
        
        // For text objects, use the actual bounding box
        if (obj.type === 'text' || obj.type === 'textbox') {
          const bbox = obj.getBoundingRect();
          totalArea += bbox.width * bbox.height;
        } else {
          // For other objects, use width/height with absolute scaling
          const width = (obj.width || 0) * scaleX;
          const height = (obj.height || 0) * scaleY;
          totalArea += width * height;
        }
      });

      const customizationCost = totalArea * PRICE_PER_PIXEL;
      
      // Update the appropriate side's customization cost
      if (designSide === "front") {
        setFrontCustomizationCost(customizationCost);
        console.log(`[Pricing] Front side - Total area: ${totalArea.toFixed(2)}px, customization cost: ₹${customizationCost.toFixed(2)}`);
      } else {
        setBackCustomizationCost(customizationCost);
        console.log(`[Pricing] Back side - Total area: ${totalArea.toFixed(2)}px, customization cost: ₹${customizationCost.toFixed(2)}`);
      }
    };

    // Debounced update to prevent too many rapid calculations
    let updateTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(calculateTotalPrice, 100);
    };

    // Add event listeners
    fabricCanvas.on("object:modified", debouncedUpdate);
    fabricCanvas.on("object:scaling", debouncedUpdate);
    fabricCanvas.on("object:moving", debouncedUpdate);
    fabricCanvas.on("object:rotating", debouncedUpdate);
    fabricCanvas.on("object:added", debouncedUpdate);
    fabricCanvas.on("object:removed", debouncedUpdate);

    // Cleanup
    return () => {
      clearTimeout(updateTimeout);
      fabricCanvas.off("object:modified", debouncedUpdate);
      fabricCanvas.off("object:scaling", debouncedUpdate);
      fabricCanvas.off("object:moving", debouncedUpdate);
      fabricCanvas.off("object:rotating", debouncedUpdate);
      fabricCanvas.off("object:added", debouncedUpdate);
      fabricCanvas.off("object:removed", debouncedUpdate);
    };
  }, [fabricCanvas, basePrice, designSide]);

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    };

    if (showColorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorDropdown]);

  // Step handlers
  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const allProducts = await fetchProducts();
      // Filter products by category (simplified - you can add category field to products later)
      setProducts(allProducts);
      setStep("product");
      toast.success(`Selected ${category.name}`);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    // Automatically select the first color variant
    if (product.variants && product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
    }
    setStep("design");
    toast.success(`Selected ${product.name}`);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setStep("design");
    toast.success(`Selected color: ${color}`);
  };

  const handleBack = () => {
    if (step === "product") {
      setStep("category");
      setSelectedCategory(null);
      setProducts([]);
    } else if (step === "design") {
      setStep("product");
      setSelectedColor(null);
    }
  };

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

  const addBackgroundPhoto = (canvas: FabricCanvas) => {
    const url = "/placeholder.svg"; // uses existing public asset
    FabricImage.fromURL(url).then((img) => {
      img.set({ left: 0, top: 0, selectable: false, evented: false, opacity: 0.25 });
      // cover entire canvas area
      const canvasW = 500;
      const canvasH = 600;
      const scaleX = canvasW / (img.width || canvasW);
      const scaleY = canvasH / (img.height || canvasH);
      const scale = Math.max(scaleX, scaleY);
      img.scale(scale);
      const newW = (img.width || 0) * scale;
      const newH = (img.height || 0) * scale;
      img.set({ left: (canvasW - newW) / 2, top: (canvasH - newH) / 2 });
      (img as any).name = "bg-photo";
      canvas.add(img);
      canvas.sendObjectToBack(img);
      (canvas as any).backgroundColor = "#f5f5f5";
      canvas.renderAll();
    });
  };

  const addProductPhotoBase = (canvas: FabricCanvas, url: string) => {
    FabricImage.fromURL(url, { crossOrigin: "anonymous" })
      .then((img) => {
        // eslint-disable-next-line no-console
        console.log("[Customize] Base image loaded successfully");
        img.set({ selectable: false, evented: false });
        // Cover entire canvas area for full width/height
        const canvasW = 500;
        const canvasH = 600;
        const scaleX = canvasW / (img.width || canvasW);
        const scaleY = canvasH / (img.height || canvasH);
        const scale = Math.max(scaleX, scaleY);
        img.scale(scale);
        const newW = (img.width || 0) * scale;
        const newH = (img.height || 0) * scale;
        img.set({ left: (canvasW - newW) / 2, top: (canvasH - newH) / 2 });
        (img as any).name = "tshirt-base-photo";
        canvas.add(img);
        // keep base above background but below custom elements
        canvas.sendObjectToBack(img);
        // but ensure bg-photo (if exists) stays at very back
        const bg = canvas.getObjects().find((o) => (o as any).name === "bg-photo");
        if (bg) {
          canvas.sendObjectToBack(bg);
        }
        canvas.renderAll();
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[Customize] Failed to load base image:", err);
        toast.error("Failed to load product image");
      });
  };

  // Pick appropriate base image for the selected side
  const pickVariantImageForSide = (variant: Product["variants"][number], side: "front" | "back") => {
    if (!variant?.images?.length) return undefined;
    // Heuristics:
    // 1) Prefer URLs containing "back" when side === back and "front" for front
    // 2) Otherwise, use index 0 for front, index 1 for back if present (fallback to 0)
    const lower = (s: string) => s.toLowerCase();
    const byHint = variant.images.find((img) =>
      side === "back" ? lower(img.url).includes("back") : lower(img.url).includes("front")
    );
    if (byHint) return byHint.url;
    if (side === "front") return variant.images[0]?.url;
    return variant.images[1]?.url || variant.images[0]?.url;
  };

  const handleAddText = () => {
    if (!fabricCanvas) return;
    const content = textInput.trim();
    if (!content) {
      toast.error("Please type your text first.");
      return;
    }

    // Check if there's an active text object selected
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && (activeObject as any).name === "custom-text") {
      // Edit existing text
      const layerId = (activeObject as any).layerId;
      (activeObject as any).set({ text: content });
      
      // Update the layer data
      const updatedLayers = designLayers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            data: {
              ...layer.data,
              content: content
            }
          };
        }
        return layer;
      });
      setDesignLayers(updatedLayers);
      
      fabricCanvas.renderAll();
      toast.success("Text updated!");
    } else {
      // Add new text
      const text = new FabricText(content, {
        left: 200,
        top: 250,
        fontSize: fontSize,
        fill: textColor,
        fontFamily: selectedFont,
      });
      (text as any).name = "custom-text";
      (text as any).layerId = `text-${Date.now()}`;

      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.renderAll();

      // Add to design layers
      const layer: DesignLayer = {
        id: (text as any).layerId,
        type: "text",
        data: {
          content,
          font: selectedFont,
          color: textColor,
          size: fontSize,
          x: 200,
          y: 250,
          scale: 1,
          rotation: 0,
        },
        // Fixed cost for layer tracking (not used for pricing anymore)
        cost: selectedProduct?.customizationPricing?.perTextLayer || 10,
      };
      setDesignLayers([...designLayers, layer]);

      toast.success("Text added! Drag to reposition.");
    }
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
        (img as any).layerId = `image-${Date.now()}`;
        
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();

        if (transparentBgEnabled) {
          applyTransparentBgToActiveImage(true);
        }

        // Add to design layers
        const layer: DesignLayer = {
          id: (img as any).layerId,
          type: "image",
          data: {
            url: imgUrl,
            x: 200,
            y: 250,
            scale: 0.3,
            rotation: 0,
          },
          cost: selectedProduct?.customizationPricing?.perImageLayer || 20,
        };
        setDesignLayers([...designLayers, layer]);

        toast.success("Image uploaded! Drag to reposition.");
      });
    };

    reader.readAsDataURL(file);
    
    // Reset the file input to allow selecting the same file again
    e.target.value = '';
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (
      activeObject &&
      (activeObject as any).name !== "tshirt-base" &&
      (activeObject as any).name !== "tshirt-base-photo" &&
      (activeObject as any).name !== "bg-photo"
    ) {
      const layerId = (activeObject as any).layerId;
      if (layerId) {
        if (designSide === "front") {
          setFrontDesignLayers(frontDesignLayers.filter((layer) => layer.id !== layerId));
        } else {
          setBackDesignLayers(backDesignLayers.filter((layer) => layer.id !== layerId));
        }
      }
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
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
      const name = (obj as any).name;
      if (name !== "tshirt-base" && name !== "tshirt-base-photo" && name !== "bg-photo") {
        fabricCanvas.remove(obj);
      }
    });
    
    fabricCanvas.renderAll();
    if (designSide === "front") {
      setFrontDesignLayers([]);
    } else {
      setBackDesignLayers([]);
    }
    toast.success(`${designSide === "front" ? "Front" : "Back"} design reset!`);
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


  const handleAddToCart = async () => {
    if (!fabricCanvas || !selectedProduct || !selectedColor) {
      toast.error("Please complete all steps before adding to cart");
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to add items to cart");
      return;
    }
    
    setAddingToCart(true);
    
    try {
      console.log("[Customize] Starting add to cart process...");
      console.log("[Customize] User token exists:", !!token);
      
      // Sync current canvas object positions/styles back into layer state for accuracy
      const syncLayersFromCanvas = (layers: DesignLayer[]): DesignLayer[] => {
        if (!fabricCanvas) return layers;
        const objects = fabricCanvas.getObjects();
        return layers.map((layer) => {
          const obj = objects.find((o: any) => (o as any).layerId === layer.id) as any;
          if (!obj) return layer;
          const next = { ...layer } as DesignLayer;
          next.data = {
            ...next.data,
            x: obj.left || 0,
            y: obj.top || 0,
            rotation: obj.angle || 0,
            // prefer scaleX for uniform scaling; Fabric uses separate X/Y
            scale: typeof obj.scaleX === 'number' ? obj.scaleX : (next.data.scale || 1),
            size: obj.fontSize || next.data.size,
            color: obj.fill || next.data.color,
            font: obj.fontFamily || next.data.font,
          } as any;
          return next;
        });
      };

      const updatedFrontLayers = designSide === 'front' ? syncLayersFromCanvas(frontDesignLayers) : frontDesignLayers;
      const updatedBackLayers = designSide === 'back' ? syncLayersFromCanvas(backDesignLayers) : backDesignLayers;

      const currentDesignData = fabricCanvas.toJSON();
      
      // Compress the preview image to reduce size and avoid MongoDB BSON limit
      const compressImage = (dataUrl: string, quality: number = 0.7): Promise<string> => {
        return new Promise<string>((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Set canvas size to reasonable dimensions
            const maxWidth = 400;
            const maxHeight = 500;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          
          img.src = dataUrl;
        });
      };
      
      const currentPreviewImage = await compressImage(
        fabricCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 }),
        0.6 // Lower quality for smaller size
      );
      
      // Prepare cart item data
      const cartItem = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        productSlug: selectedProduct.slug,
        selectedColor,
        selectedSize,
        frontDesign: {
          designData: currentDesignData,
          designLayers: updatedFrontLayers,
          previewImage: currentPreviewImage,
        },
        backDesign: {
          designData: null, // Will be updated when back design is complete
          designLayers: updatedBackLayers,
          previewImage: null,
        },
        basePrice,
        frontCustomizationCost,
        backCustomizationCost,
        totalPrice,
        quantity: 1,
      };
      
      // Check if cart item is too large for MongoDB (16MB limit)
      const cartItemSize = JSON.stringify(cartItem).length;
      console.log("[Customize] Cart item size:", cartItemSize, "bytes");
      
      if (cartItemSize > 15 * 1024 * 1024) { // 15MB safety margin
        toast.error("Design data is too large. Please reduce image size or remove some elements.");
        return;
      }
      
      console.log("[Customize] Cart item prepared:", cartItem);
      
      // Add to cart via context
      await addItemToCart(cartItem);
    } catch (error) {
      console.error("[Customize] Add to cart error:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!fabricCanvas || !selectedProduct || !selectedColor) {
      toast.error("Please complete all steps before saving");
      return;
    }
    
    setSavingDesign(true);
    try {
      // Sync current canvas object positions/styles back into layer state for accuracy
      const syncLayersFromCanvas = (layers: DesignLayer[]): DesignLayer[] => {
        if (!fabricCanvas) return layers;
        const objects = fabricCanvas.getObjects();
        return layers.map((layer) => {
          const obj = objects.find((o: any) => (o as any).layerId === layer.id) as any;
          if (!obj) return layer;
          const next = { ...layer } as DesignLayer;
          next.data = {
            ...next.data,
            x: obj.left || 0,
            y: obj.top || 0,
            rotation: obj.angle || 0,
            // prefer scaleX for uniform scaling; Fabric uses separate X/Y
            scale: typeof obj.scaleX === 'number' ? obj.scaleX : (next.data.scale || 1),
            size: obj.fontSize || next.data.size,
            color: obj.fill || next.data.color,
            font: obj.fontFamily || next.data.font,
          } as any;
          return next;
        });
      };

      const updatedFrontLayers = designSide === 'front' ? syncLayersFromCanvas(frontDesignLayers) : frontDesignLayers;
      const updatedBackLayers = designSide === 'back' ? syncLayersFromCanvas(backDesignLayers) : backDesignLayers;

      const currentDesignData = fabricCanvas.toJSON();
      const currentPreviewImage = fabricCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
      const payload = {
        name: `${selectedProduct.name} - ${selectedColor} (${selectedSize})`,
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        productSlug: selectedProduct.slug,
        selectedColor,
        selectedSize,
        frontDesign: {
          designData: currentDesignData,
          designLayers: updatedFrontLayers,
          previewImage: currentPreviewImage,
        },
        backDesign: {
          designLayers: updatedBackLayers,
        },
        totalPrice,
      };
      await saveMyDesign(payload);
      toast.success("Design saved to your account");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save design");
    } finally {
      setSavingDesign(false);
    }
  };

  const applyTransparentBgToActiveImage = (enabled: boolean) => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject() as any;
    if (!active || active.type !== "image") {
      if (enabled) toast.error("Select an image to make background transparent.");
      return;
    }

    const fabricNS: any = (window as any).fabric;
    const RemoveColor = fabricNS?.Image?.filters?.RemoveColor;
    if (!RemoveColor) {
      toast.error("Transparent background not supported in this browser.");
      return;
    }

    active.filters = active.filters || [];
    if (enabled) {
      // remove any existing RemoveColor filter then add one
      active.filters = active.filters.filter((f: any) => !(f && f.type === "RemoveColor"));
      const filter = new RemoveColor({ color: transparentColor, distance: 0.25 });
      filter.type = "RemoveColor"; // help identification
      active.filters.push(filter);
    } else {
      active.filters = active.filters.filter((f: any) => !(f && f.type === "RemoveColor"));
    }
    active.applyFilters();
    fabricCanvas.requestRenderAll();
  };

  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { id: "category", label: "Category", icon: "📂" },
      { id: "product", label: "Product", icon: "👕" },
      { id: "design", label: "Design", icon: "✏️" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === step);

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                idx <= currentStepIndex
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <span className="text-xl">{s.icon}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  idx < currentStepIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">

        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-4xl mx-auto"
            >
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold mb-6 text-center">Select a Category</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CATEGORIES.map((category) => (
                      <Button
                        key={category.id}
                        variant="outline"
                        className="h-32 flex flex-col gap-2"
                        onClick={() => handleCategorySelect(category)}
                        disabled={loading}
                      >
                        <span className="text-4xl">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Product Selection */}
          {step === "product" && (
            <motion.div
              key="product"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto"
            >
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">
                      {selectedCategory?.name} - Select a Product
                    </h2>
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </div>
                  {loading ? (
                    <div className="text-center py-12">Loading products...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <Card
                          key={product._id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleProductSelect(product)}
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                              {product.variants[0]?.images[0] ? (
                                <img
                                  src={product.variants[0].images[0].url}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-4xl">👕</span>
                              )}
                            </div>
                            <h3 className="font-semibold mb-2">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {product.description}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              ₹{product.price.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}


          {/* Step 4: Design */}
          {step === "design" && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0 }}
            >
        <div className="grid gap-8 lg:grid-cols-[400px_1fr_300px]">
          {/* Left Sidebar - Product Options */}
          <Card className="h-fit">
            <CardContent className="p-6 space-y-6">
              <div>
                      <Label className="mb-3 block text-base font-semibold">Design Side</Label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <Button
                          variant={designSide === "front" ? "default" : "outline"}
                          onClick={() => setDesignSide("front")}
                          className="w-full"
                        >
                          Front
                        </Button>
                        <Button
                          variant={designSide === "back" ? "default" : "outline"}
                          onClick={() => setDesignSide("back")}
                          className="w-full"
                        >
                          Back
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Front: {frontDesignLayers.length} elements | Back: {backDesignLayers.length} elements
                </div>
              </div>

                    <div className="border-t pt-4">
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
                <Label className="mb-3 block text-base font-semibold">Product Color</Label>
                {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-3">
                    {/* Color Dropdown Trigger */}
                    <div className="relative" ref={colorDropdownRef}>
                      <Button
                        variant="outline"
                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                        className="w-full h-12 flex items-center justify-between p-3 rounded-lg border bg-primary/10 border-primary/20 hover:bg-primary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-border"
                            style={{ backgroundColor: selectedProduct.variants.find(v => v.color === selectedColor)?.colorCode || '#ffffff' }}
                          />
                          <span className="font-medium">{selectedColor}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
                      </Button>

                      {/* Color Dropdown Content */}
                      {showColorDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                          <div className="p-4">
                            <div className="grid grid-cols-10 gap-2">
                              {selectedProduct.variants.map((variant) => (
                                <button
                                  key={variant.color}
                                  onClick={() => {
                                    setSelectedColor(variant.color);
                                    setShowColorDropdown(false);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                                    selectedColor === variant.color 
                                      ? 'border-primary ring-2 ring-primary/20' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  style={{ backgroundColor: variant.colorCode }}
                                  title={variant.color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">₹{basePrice.toFixed(2)}</span>
                  </div>
                  
                  {frontCustomizationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Front Design:</span>
                      <span className="font-medium">₹{frontCustomizationCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {backCustomizationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Back Design:</span>
                      <span className="font-medium">₹{backCustomizationCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center - Canvas */}
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-muted/30 p-4 shadow-lg">
                    <canvas ref={canvasElRef} className="max-w-full" />
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
              <Button size="sm" onClick={handleSaveDesign} disabled={savingDesign}>
                {savingDesign ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
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
                    <Label className="mb-2 block">Your Text</Label>
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type here..."
                      className="mb-4"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddText();
                      }}
                    />
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
                    {fabricCanvas?.getActiveObject() && (fabricCanvas.getActiveObject() as any).name === "custom-text" ? "Update Text" : "Add Text"}
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

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
                    <p className="font-medium text-blue-800">💡 Pro Tip:</p>
                    <p className="mt-1 text-blue-700">PNG images give you the best results with transparent backgrounds and high quality.</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-3 border-t pt-6">
                <Button 
                  onClick={handleAddToCart} 
                  className="w-full gradient-hero shadow-primary"
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Free shipping on orders over $50
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
