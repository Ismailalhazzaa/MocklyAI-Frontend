import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('يرجى ملء جميع الحقول');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/users/login', {
        email: email.trim(),
        password,
      });

      const { user } = response.data.data;

      localStorage.setItem('user', JSON.stringify({
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        token: user.token,
      }));

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في MocklyAI',
      });
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="animate-fade-in shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4">
                <img 
                  src="/image-upload/201643e7-f106-4e70-b66d-0f1bf2e1d5d7.png" 
                  alt="MocklyAI Logo" 
                  className="h-16 w-auto mx-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                تسجيل الدخول إلى حسابك
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                ادخل بياناتك للوصول إلى حسابك
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      تذكرني
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-hero"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  {!isLoading && <ArrowLeft className="mr-2 h-4 w-4" />}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    لا تملك حساباً؟{' '}
                    <Link
                      to="/register"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      إنشاء حساب جديد
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <Card className="mt-6 bg-card-accent animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">حساب تجريبي:</h3>
              <p className="text-xs text-muted-foreground">
                البريد الإلكتروني: user@example.com<br />
                كلمة المرور: password
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;