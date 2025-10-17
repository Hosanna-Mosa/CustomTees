import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { login } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: setAuthToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    // already logged in redirect to home
    navigate('/');
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      const token = (res as any).data?.token || (res as any).token;
      if (!token) throw new Error('Invalid server response');
      setAuthToken(token);
      toast.success('Login successful.');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-md flex-1">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Loading...' : 'Login'}</Button>
          <div className="text-sm text-muted-foreground text-center">
            Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}


