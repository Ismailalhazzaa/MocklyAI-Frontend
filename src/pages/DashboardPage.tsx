import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Target, Award, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatestSession {
  _id: string;
  specialization: string;
  score: number;
  numberOfQuestions: number;
  durationMinutes?: number;
  createdAt: string;
}

interface DashboardData {
  numberOfSessions: number;
  averageScore: number;
  totalTrainingMinutes: number;
  bestSessionScore: number;
  improvmentRate: number;
  latestUserSession: LatestSession;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSessions, setNoSessions] = useState(false);
  const { toast } = useToast();

  const getUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const currentUser = getUser();

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setNoSessions(false);
      try {
        const res = await axiosInstance.get('/dashboard/user-dashboard');
        setDashboardData(res.data.data);
      } catch (err: any) {
        if (err?.response?.status === 400) {
          setNoSessions(true);
        } else if (!err.isAuthError) {
          toast({
            title: 'خطأ في تحميل البيانات',
            description: err?.response?.data?.message || 'تعذر تحميل بيانات لوحة التحكم',
            variant: 'destructive',
          });
        }
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // firstSessionScore = averageScore - improvmentRate
  const firstSessionScore = dashboardData
    ? dashboardData.averageScore - dashboardData.improvmentRate
    : 0;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جارٍ تحميل بياناتك...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── No sessions yet ──────────────────────────────────────────────────────
  if (noSessions) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">ملخص أدائك وتقدمك على المنصة</p>
          </div>
          <Card className="text-center py-20">
            <CardContent>
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-semibold mb-2">لا توجد بيانات بعد</h3>
              <p className="text-muted-foreground mb-6">
                أكمل جلستك الأولى لتبدأ في رؤية إحصائياتك هنا
              </p>
              <Link to="/setup">
                <Button className="btn-hero">ابدأ جلستك الأولى</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">ملخص أدائك وتقدمك على المنصة</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
                  <p className="text-3xl font-bold text-foreground">{dashboardData!.numberOfSessions}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط التقييم</p>
                  <p className="text-3xl font-bold text-foreground">{dashboardData!.averageScore}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">دقائق التدريب</p>
                  <p className="text-3xl font-bold text-foreground">{dashboardData!.totalTrainingMinutes}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">أفضل نتيجة</p>
                  <p className="text-3xl font-bold text-foreground">{dashboardData!.bestSessionScore}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Last Session Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                آخر جلسة تدريبية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">التاريخ</span>
                <span className="font-medium">{formatDate(dashboardData!.latestUserSession.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">التخصص</span>
                <span className="font-medium">{dashboardData!.latestUserSession.specialization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">النتيجة</span>
                <span className="font-bold text-primary">{dashboardData!.latestUserSession.score}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الأسئلة المجابة</span>
                <span className="font-medium">{dashboardData!.latestUserSession.numberOfQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المدة</span>
                <span className="font-medium">
                  {dashboardData!.latestUserSession.durationMinutes
                    ? `${dashboardData!.latestUserSession.durationMinutes} دقيقة`
                    : '—'}
                </span>
              </div>
              <Link to="/history">
                <Button variant="outline" className="w-full mt-4">
                  عرض السجل الكامل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Improvement Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                نسبة التحسن
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <div className={`text-5xl font-bold mb-2 ${dashboardData!.improvmentRate >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {dashboardData!.improvmentRate >= 0 ? '+' : ''}{dashboardData!.improvmentRate}%
                </div>
                <p className="text-muted-foreground">تحسن مقارنة بأول جلسة</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">أول جلسة</span>
                  <span className="font-medium">{firstSessionScore}%</span>
                </div>
                <Progress value={Math.max(0, firstSessionScore)} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المتوسط الحالي</span>
                  <span className="font-medium text-green-500">{dashboardData!.averageScore}%</span>
                </div>
                <Progress value={dashboardData!.averageScore} className="h-2 bg-green-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/setup">
            <Button size="lg" className="btn-hero">
              ابدأ جلسة جديدة
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;