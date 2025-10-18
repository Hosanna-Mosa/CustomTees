import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { addAddress, updateAddress, deleteAddress, getMe } from '@/lib/api';
import { toast } from 'sonner';

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onAddressSelect: (addressId: string | null) => void;
}

export function AddressSelector({ selectedAddressId, onAddressSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<Address>({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await getMe();
      const userAddresses = (res as any).data?.addresses || [];
      setAddresses(userAddresses);
      
      // Auto-select default address if none selected
      if (!selectedAddressId && userAddresses.length > 0) {
        const defaultAddr = userAddresses.find((addr: Address) => addr.isDefault);
        if (defaultAddr) {
          onAddressSelect(defaultAddr._id!);
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingAddress) {
        res = await updateAddress(editingAddress._id!, form);
        toast.success('Address updated successfully');
      } else {
        res = await addAddress(form);
        toast.success('Address added successfully');
      }
      
      const updatedAddresses = (res as any).data || res;
      setAddresses(updatedAddresses);
      
      // If this is the first address, auto-select it
      if (addresses.length === 0 && updatedAddresses.length > 0) {
        onAddressSelect(updatedAddresses[0]._id);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setForm({ ...address });
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        const res = await deleteAddress(addressId);
        const updatedAddresses = (res as any).data || res;
        setAddresses(updatedAddresses);
        
        // If deleted address was selected, clear selection
        if (selectedAddressId === addressId) {
          onAddressSelect(null);
        }
        
        toast.success('Address deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete address');
      }
    }
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });
    setEditingAddress(null);
  };

  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No addresses found</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <AddressForm 
                  form={form} 
                  setForm={setForm} 
                  onSubmit={handleSubmit} 
                  loading={loading}
                  onCancel={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <>
            <RadioGroup value={selectedAddressId || ''} onValueChange={onAddressSelect}>
              {addresses.map((address) => (
                <div key={address._id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={address._id!} id={address._id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={address._id} className="cursor-pointer">
                      <div className="font-medium">{address.fullName} • {address.phone}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                        <br />
                        {address.city}, {address.state} {address.postalCode}
                        <br />
                        {address.country}
                      </div>
                      {address.isDefault && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                          Default
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(address._id!)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <AddressForm 
                  form={form} 
                  setForm={setForm} 
                  onSubmit={handleSubmit} 
                  loading={loading}
                  onCancel={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {selectedAddress && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Selected: {selectedAddress.fullName}, {selectedAddress.city}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AddressFormProps {
  form: Address;
  setForm: (form: Address) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onCancel: () => void;
}

function AddressForm({ form, setForm, onSubmit, loading, onCancel }: AddressFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <Input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
      </div>
      
      <Input
        placeholder="Address line 1"
        value={form.line1}
        onChange={(e) => setForm({ ...form, line1: e.target.value })}
        required
      />
      
      <Input
        placeholder="Address line 2 (optional)"
        value={form.line2}
        onChange={(e) => setForm({ ...form, line2: e.target.value })}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <Input
          placeholder="State"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Postal code"
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          required
        />
        <Input
          placeholder="Country"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          required
        />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
