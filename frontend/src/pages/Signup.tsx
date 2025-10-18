import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import { signup } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: setAuthToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/');
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signup({ name, email, password });
      const token = (res as any).data?.token || (res as any).token;
      if (!token) throw new Error('Invalid server response');
      setAuthToken(token);
      toast.success('Signup successful.');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-md flex-1">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Loading...' : 'Sign up'}</Button>
          <div className="text-sm text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary">Login</Link>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}


