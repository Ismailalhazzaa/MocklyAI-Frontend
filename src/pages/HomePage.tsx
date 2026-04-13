import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';

import { 
  Brain, 
  Mic, 
  BarChart3, 
  Users, 
  Star, 
  ArrowLeft,
  CheckCircle,
  Play,
  Target,
  Zap,
  MessageSquare,
  Check,
  Mail,
  Phone,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const HomePage = () => {
  const { toast } = useToast();

  // ─── Feedback form state ───────────────────────────────────────────────
  const [feedbackName, setFeedbackName]       = useState('');
  const [feedbackEmail, setFeedbackEmail]     = useState('');
  const [feedbackText, setFeedbackText]       = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSent, setFeedbackSent]       = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackEmail.trim() || !feedbackText.trim()) {
      toast({
        title: 'جميع الحقول مطلوبة',
        description: 'يرجى ملء الاسم والبريد الإلكتروني والرسالة',
        variant: 'destructive',
      });
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await axiosInstance.post('/users/feedback', {
        name: feedbackName.trim(),
        email: feedbackEmail.trim(),
        feedbacktext: feedbackText.trim(),
      });
      setFeedbackSent(true);
      setFeedbackName('');
      setFeedbackEmail('');
      setFeedbackText('');
      toast({
        title: 'تم إرسال رسالتك ✅',
        description: res.data.data,
      });
    } catch (err: any) {
      toast({
        title: 'فشل الإرسال',
        description: err?.response?.data?.message || 'حدث خطأ أثناء إرسال الرسالة، حاول مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gradient leading-tight" style={{ paddingBottom: '1.5rem' }}>
              استعد للمقابلات الوظيفية مع الذكاء الاصطناعي
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed pt-2">
              منصة تدريب تفاعلية تساعدك على التحضير لمقابلات العمل باستخدام تقنيات الذكاء الاصطناعي المتقدمة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="btn-hero">
                  ابدأ التدريب الآن
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="btn-outline-hero">
                تعرف على المميزات
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              لماذا MocklyAI؟
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              منصة شاملة تجمع بين التقنيات المتطورة والخبرة العملية
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="feature-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">مقابلات ذكية</h3>
                <p className="text-muted-foreground">
                  تفاعل مع مقابل ذكي يحاكي المقابلات الحقيقية
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-4">تحليل فوري</h3>
                <p className="text-muted-foreground">
                  احصل على تقييم مباشر لأدائك ونصائح للتحسين
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-brand-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">تدريب مخصص</h3>
                <p className="text-muted-foreground">
                  برنامج تدريب مصمم خصيصاً حسب مجالك ومستواك
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-brand-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-brand-danger" />
                </div>
                <h3 className="text-xl font-semibold mb-4">تتبع التقدم</h3>
                <p className="text-muted-foreground">
                  راقب تطورك واحصل على تقارير مفصلة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              كيف تعمل المنصة؟
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. أنشئ حسابك</h3>
              <p className="text-muted-foreground text-lg">
                سجل وأكمل ملفك الشخصي
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. ابدأ التدريب</h3>
              <p className="text-muted-foreground text-lg">
                اختر نوع المقابلة وابدأ الجلسة
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. احصل على التقييم</h3>
              <p className="text-muted-foreground text-lg">
                راجع أداءك والنصائح للتحسين
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              تواصل معنا
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نحن هنا لمساعدتك وللرد على استفساراتك
            </p>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6 lg:space-y-8">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">البريد الإلكتروني</h3>
                  <p className="text-muted-foreground mb-2 text-sm sm:text-base">راسلنا عبر البريد الإلكتروني</p>
                  <a href="mailto:info@mocklyai.com" className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base font-medium">
                    mocklyai10@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">الهاتف</h3>
                  <p className="text-muted-foreground mb-2 text-sm sm:text-base">تواصل معنا عبر الهاتف</p>
                  <a href="tel:+966501234567" className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base font-medium">
                    +966 50 123 4567
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-brand-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">الدعم الفني</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">فريق الدعم متاح 24/7 لخدمتك</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="feature-card">
              <CardContent className="p-6 sm:p-8">
                {feedbackSent ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">تم إرسال رسالتك!</h3>
                    <p className="text-muted-foreground mb-6">سيتم التواصل معك قريباً، نشكرك على ثقتك ❤️</p>
                    <Button variant="outline" onClick={() => setFeedbackSent(false)}>
                      إرسال رسالة أخرى
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">أرسل لنا رسالة</h3>
                    <form className="space-y-4 sm:space-y-6" onSubmit={handleFeedbackSubmit}>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
                          placeholder="أدخل اسمك الكامل"
                          disabled={feedbackLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm sm:text-base"
                          placeholder="أدخل بريدك الإلكتروني"
                          disabled={feedbackLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          الرسالة
                        </label>
                        <textarea
                          rows={4}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-sm sm:text-base"
                          placeholder="اكتب رسالتك هنا..."
                          disabled={feedbackLoading}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full btn-hero" disabled={feedbackLoading}>
                        {feedbackLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ الإرسال...</>
                        ) : (
                          'إرسال الرسالة'
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              جاهز لبدء رحلتك؟
            </h2>
            <p className="text-xl mb-8 opacity-90">
              انضم إلى آلاف المحترفين الذين حسنوا من فرصهم الوظيفية
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-primary hover:text-primary/90">
                ابدأ مجاناً الآن
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;