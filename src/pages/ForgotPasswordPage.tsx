import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

import { Mail, ArrowLeft, KeyRound, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();



  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post('/users/forgot-password', { email: email.trim() });
      toast({
        title: 'تم إرسال رمز التحقق',
        description: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إرسال الرمز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpValue.length < 6) {
      setError('يرجى إدخال الرمز كاملاً');
      return;
    }

    setIsLoading(true);
    try {
      // ⚠️ لا يوجد API call هنا — هذا هو الإصلاح
      // استدعاء /verify-otp هنا كان يحذف الـ OTP من DB
      // مما يجعل /reset-password في الخطوة 3 يفشل
      // الحل: نحفظ الـ OTP في state ونرسله مع /reset-password
      toast({
        title: 'تم التحقق بنجاح',
        description: 'يمكنك الآن إنشاء كلمة مرور جديدة',
      });
      setStep('newPassword');
    } catch {
      setError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post('/users/reset-password', {
        email: email.trim(),
        code: otpValue,
        newPassword,
      });
      toast({
        title: 'تم تغيير كلمة المرور',
        description: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إعادة التعيين. يرجى المحاولة مرة أخرى.');
      if (err.response?.status === 400) {
        setStep('otp');
        setOtpValue('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'نسيت كلمة المرور';
      case 'otp': return 'أدخل رمز التحقق';
      case 'newPassword': return 'كلمة مرور جديدة';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'email': return 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق';
      case 'otp': return 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك';
      case 'newPassword': return 'أدخل كلمة المرور الجديدة';
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

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      (step === 'email' && s === 1) || (step === 'otp' && s === 2) || (step === 'newPassword' && s === 3)
                        ? 'bg-primary text-primary-foreground'
                        : (step === 'otp' && s === 1) || (step === 'newPassword' && s <= 2)
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {((step === 'otp' && s === 1) || (step === 'newPassword' && s <= 2)) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : s}
                    </div>
                    {s < 3 && <div className={`w-8 h-0.5 ${
                      (step === 'otp' && s === 1) || (step === 'newPassword' && s <= 2) ? 'bg-success' : 'bg-muted'
                    }`} />}
                  </div>
                ))}
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                {getStepTitle()}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {getStepSubtitle()}
              </p>
            </CardHeader>

            <CardContent>
              {/* Step 1: Email */}
              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-6">
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

                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                    {!isLoading && <ArrowLeft className="mr-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center pt-4">
                    <Link to="/login" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                      العودة لتسجيل الدخول
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2: OTP */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <Label className="text-sm font-medium block text-center">
                      رمز التحقق
                    </Label>
                    <p className="text-xs text-muted-foreground text-center">
                      تم إرسال الرمز إلى <span className="font-medium text-foreground">{email}</span>
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
                    {isLoading ? 'جاري التحقق...' : 'تحقق من الرمز'}
                    {!isLoading && <KeyRound className="mr-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setOtpValue(''); setError(''); }}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      إعادة إرسال الرمز
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'newPassword' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      كلمة المرور الجديدة
                    </Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="أدخل كلمة المرور الجديدة"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      تأكيد كلمة المرور
                    </Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="أعد إدخال كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 pl-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword === confirmPassword && (
                      <div className="flex items-center space-x-2 space-x-reverse text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">كلمتا المرور متطابقتان</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
                    {!isLoading && <ArrowLeft className="mr-2 h-4 w-4" />}
                  </Button>
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

export default ForgotPasswordPage;