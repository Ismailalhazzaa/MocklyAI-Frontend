import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';

import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Target,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';

// ─────────────────────────────────────────────
// Types – mirror the backend Session document
// ─────────────────────────────────────────────
interface AiEvaluation {
  clarity: number;
  confidence: number;
  relevance: number;
  organization: number;
  engagement: number;
}

interface SessionSummary {
  _id: string;
  specialization: string;
  numberOfQuestions: number;
  difficultyLevel: string;
  score: number;
  aiEvaluation: AiEvaluation;
  strengths: string[];
  improvements: string[];
  softSkillsRecommendations: string[];
  durationMinutes: number;
  endedAt: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Helper: get logged-in user info from localStorage
// ─────────────────────────────────────────────
const getUser = (): { name: string; id: string } => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return { name: parsed?.fullname ?? 'مستخدم', id: parsed?.id ?? '' };
    }
  } catch { /* ignore */ }
  return { name: 'مستخدم', id: '' };
};

// ─────────────────────────────────────────────
// Helper: map difficulty enum to Arabic label
// ─────────────────────────────────────────────
const difficultyLabel: Record<string, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(215, 20%, 65%)'];

const SessionSummaryPage = () => {
  const [summaryData, setSummaryData]   = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  // ─── State passed from QuestionPage / AnalysisPage ───
  const {
    sessionId,
    sessionData,
    completedQuestions,
    endedEarly,
  } = (location.state ?? {}) as {
    sessionId?: string;
    sessionData?: any;
    completedQuestions?: number;
    endedEarly?: boolean;
  };

  // Guard: if no sessionId, redirect to setup
  useEffect(() => {
    if (!sessionId) {
      toast({
        title: 'لا توجد جلسة نشطة',
        description: 'يرجى إنشاء جلسة جديدة',
        variant: 'destructive',
      });
      navigate('/setup');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Call end-session API on mount ───
  useEffect(() => {
    if (!sessionId) return;
    const endSession = async () => {
      setIsLoading(true);
      try {
        // GET /api/sessions/end-session/:sessionId
        // Backend computes overall score, saves the session, and returns the full session doc
        const response = await axiosInstance.get(`/sessions/end-session/${sessionId}`);
        // Response: { status: "SUCCESS", data: <Session doc> }
        const session: SessionSummary = response.data.data;
        setSummaryData(session);

        // ─── إشعار النتيجة ───
        if (session.score > 50) {
          toast({
            title: 'نتيجة قوية 🔥',
            description: 'أنت معلم ونحن منك نتعلم، نتيجة مميزة جداً ❤️👌',
          });
        } else {
          toast({
            title: 'لا تيأس ❤️',
            description: 'نتيجتك جيدة، تابع واستمر، لا تتوقف أبداً 💕',
          });
        }

        // Clear session state from sessionStorage
        sessionStorage.removeItem('currentQuestionNumber');

      } catch (err) {
        const msg = err?.response?.data?.message;

        // "الجلسة انتهت و تم تقييمها بالفعل" means session was already ended
        // This can happen if the user navigates back – just try fetching from history
        if (err?.response?.status === 400 && msg?.includes('انتهت')) {
          toast({
            title: 'تم تقييم الجلسة مسبقاً',
            description: 'جاري عرض النتائج السابقة',
          });
          // Fallback: use data from sessionData if available
          if (sessionData) {
            setSummaryData(null); // will show fallback UI
          }
        } else {
          toast({
            title: 'حدث خطأ أثناء إنهاء الجلسة',
            description: msg || 'يرجى المحاولة مرة أخرى',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    endSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ─── Download statistics as XLSX ───
  const handleDownloadReport = async () => {
    const user = getUser();
    if (!user.id) {
      toast({ title: 'تعذر تحديد هوية المستخدم', variant: 'destructive' });
      return;
    }
    setIsDownloading(true);
    try {
      // GET /api/sessions/export-user-statistics/:userId  (returns XLSX file)
      const response = await axiosInstance.get(`/sessions/export-user-statistics/${user.id}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statistics_${user.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'تم تحميل التقرير بنجاح' });
    } catch {
      toast({ title: 'تعذر تحميل التقرير', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareResults = () => {
    const text = summaryData
      ? `حققت ${summaryData.score} نقطة في جلسة تدريبية على MocklyAI في تخصص ${summaryData.specialization}! 🎉`
      : 'أنهيت جلسة تدريبية على MocklyAI!';
    if (navigator.share) {
      navigator.share({ title: 'MocklyAI – نتيجتي', text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'تم نسخ النتيجة إلى الحافظة' });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'ممتاز', color: 'bg-success' };
    if (score >= 60) return { variant: 'secondary' as const, text: 'جيد', color: 'bg-yellow-500' };
    return { variant: 'destructive' as const, text: 'يحتاج تحسين', color: 'bg-destructive' };
  };

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={getUser().name} />
        <div className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                جاري تحليل الجلسة الكاملة...
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                يقوم الذكاء الاصطناعي بإعداد تقرير شامل عن أدائك
              </p>
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Fallback if API failed (already ended or error) ───
  if (!summaryData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={getUser().name} />
        <div className="pt-20 pb-16 px-4 text-center">
          <div className="container mx-auto max-w-md">
            <Trophy className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">انتهت الجلسة</h1>
            <p className="text-muted-foreground mb-8">
              تم إنهاء الجلسة. يمكنك مراجعة نتائجك في سجل الجلسات.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/setup')} className="btn-hero">
                ابدأ جلسة جديدة
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/history')}>
                عرض سجل الجلسات
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Build pie chart data from aiEvaluation ───
  const pieData = [
    { name: 'الوضوح', value: summaryData.aiEvaluation?.clarity ?? 0 },
    { name: 'الثقة', value: summaryData.aiEvaluation?.confidence ?? 0 },
    { name: 'الملاءمة', value: summaryData.aiEvaluation?.relevance ?? 0 },
  ];

  const avgTimePerQuestion = summaryData.durationMinutes && summaryData.numberOfQuestions
    ? parseFloat((summaryData.durationMinutes / summaryData.numberOfQuestions).toFixed(1))
    : 0;

  const sessionDate = summaryData.endedAt
    ? new Date(summaryData.endedAt).toLocaleDateString('ar-SA')
    : new Date().toLocaleDateString('ar-SA');

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={getUser().name} />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ملخص الجلسة التدريبية
            </h1>
            <p className="text-xl text-muted-foreground">
              إليك تقرير شامل عن أدائك في جلسة اليوم
            </p>
          </div>

          {/* Overall Score Card */}
          <Card className="mb-8 animate-slide-up bg-gradient-hero text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-7xl font-bold mb-4">
                  {summaryData.score ?? '—'}
                </div>
                <div className="text-2xl font-semibold mb-2">التقييم العام</div>
                <Badge
                  className={`text-lg px-6 py-2 ${getScoreBadge(summaryData.score).color} text-white border-white`}
                >
                  {getScoreBadge(summaryData.score).text}
                </Badge>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{completedQuestions ?? summaryData.numberOfQuestions}</div>
                    <div className="text-sm opacity-90">أسئلة مجاب عليها</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{summaryData.durationMinutes ?? '—'}</div>
                    <div className="text-sm opacity-90">دقيقة إجمالي</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{avgTimePerQuestion}</div>
                    <div className="text-sm opacity-90">دقيقة لكل سؤال</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{summaryData.specialization}</div>
                    <div className="text-sm opacity-90">التخصص</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
            {/* Performance Details */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>تفاصيل الأداء</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">الوضوح</span>
                      <span className="text-sm font-bold text-primary">{summaryData.aiEvaluation?.clarity ?? 0}%</span>
                    </div>
                    <Progress value={summaryData.aiEvaluation?.clarity ?? 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">الثقة</span>
                      <span className="text-sm font-bold text-primary">{summaryData.aiEvaluation?.confidence ?? 0}%</span>
                    </div>
                    <Progress value={summaryData.aiEvaluation?.confidence ?? 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">الملاءمة</span>
                      <span className="text-sm font-bold text-primary">{summaryData.aiEvaluation?.relevance ?? 0}%</span>
                    </div>
                    <Progress value={summaryData.aiEvaluation?.relevance ?? 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">التنظيم</span>
                      <span className="text-sm font-bold text-primary">{summaryData.aiEvaluation?.organization ?? 0}%</span>
                    </div>
                    <Progress value={summaryData.aiEvaluation?.organization ?? 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">التفاعل</span>
                      <span className="text-sm font-bold text-primary">{summaryData.aiEvaluation?.engagement ?? 0}%</span>
                    </div>
                    <Progress value={summaryData.aiEvaluation?.engagement ?? 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart – top 3 metrics */}

          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span>نقاط القوة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.strengths?.length > 0 ? (
                  <div className="space-y-4">
                    {summaryData.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-3 space-x-reverse">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">لا توجد نقاط قوة محددة</p>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>مجالات التحسين</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.improvements?.length > 0 ? (
                  <div className="space-y-4">
                    {summaryData.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-3 space-x-reverse">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{improvement}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">أداء ممتاز! لا توجد مجالات تحتاج تحسيناً</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Soft Skills Recommendations */}
          {summaryData.softSkillsRecommendations?.length > 0 && (
            <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>توصيات المهارات الشخصية</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaryData.softSkillsRecommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 bg-card-accent rounded-lg">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-foreground">{recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Details */}
          <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle>تفاصيل الجلسة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">التاريخ</p>
                  <p className="font-medium">{sessionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التخصص</p>
                  <p className="font-medium">{summaryData.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مستوى الصعوبة</p>
                  <Badge variant="secondary">
                    {difficultyLabel[summaryData.difficultyLevel] ?? summaryData.difficultyLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
                  <p className="font-medium">{summaryData.numberOfQuestions} سؤال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button onClick={() => navigate('/setup')} className="btn-hero">
              ابدأ جلسة جديدة
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/history')} className="btn-outline-hero">
              عرض سجل الجلسات
            </Button>
            <Button variant="ghost" onClick={handleDownloadReport} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Download className="ml-2 h-4 w-4" />
              )}
              تحميل التقرير
            </Button>
            <Button variant="ghost" onClick={handleShareResults}>
              <Share2 className="ml-2 h-4 w-4" />
              مشاركة النتائج
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SessionSummaryPage;