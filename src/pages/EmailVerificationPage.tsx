import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

import { Mail, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

const EmailVerificationPage = () => {
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();


  const userEmail = (location.state as { email?: string })?.email || '';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpValue.length < 6) {
      setError('يرجى إدخال الرمز كاملاً');
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post('/users/verify-otp', {
        email: userEmail,
        code: otpValue,
      });

      setIsVerified(true);
      toast({
        title: 'تم تأكيد البريد الإلكتروني',
        description: 'تم تأكيد بريدك الإلكتروني بنجاح',
      });
      setTimeout(() => navigate('/setup'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      await axiosInstance.post('/users/resend-otp', { email: userEmail });
      toast({
        title: 'تم إعادة الإرسال',
        description: 'تم إرسال رمز تحقق جديد إلى بريدك',
      });
      setOtpValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setIsResending(false);
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

              {/* Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
                isVerified ? 'bg-success/10' : 'bg-primary/10'
              }`}>
                {isVerified ? (
                  <CheckCircle className="h-8 w-8 text-success animate-fade-in" />
                ) : (
                  <Mail className="h-8 w-8 text-primary" />
                )}
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                {isVerified ? 'تم التأكيد!' : 'تأكيد البريد الإلكتروني'}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {isVerified ? 'تم تأكيد بريدك الإلكتروني بنجاح' : 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني'}
              </p>
            </CardHeader>

            <CardContent>
              {isVerified ? (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    جاري تحويلك إلى صفحة الإعداد...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      تم إرسال الرمز إلى <span className="font-medium text-foreground">{userEmail}</span>
                    </p>

                    <div className="flex justify-center" dir="ltr">
                      <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} disabled={isLoading}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-hero" disabled={isLoading || otpValue.length < 6}>
                    {isLoading ? 'جاري التحقق...' : 'تأكيد البريد'}
                    {!isLoading && <KeyRound className="mr-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                      {isResending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EmailVerificationPage;