import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';

import {
  Calendar,
  Clock,
  Eye,
  Search,
  BarChart3,
  Target,
  TrendingUp,
  MessageSquare,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionFromAPI {
  _id: string;
  userId: string;
  specialization: string;
  numberOfQuestions: number;
  questionTypes: string[];
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  score: number;
  durationMinutes?: number;
  ended: boolean;
  createdAt: string;
  aiEvaluation?: {
    clarity?: number;
    confidence?: number;
    relevance?: number;
    organization?: number;
    engagement?: number;
  };
  strengths?: string[];
  improvements?: string[];
  softSkillsRecommendations?: string[];
}

interface SessionDetails {
  session: SessionFromAPI;
  questions: { question: string; score: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyMap: Record<string, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-yellow-600';
  return 'text-destructive';
};

const getScoreProgressColor = (score: number) => {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-destructive';
};

const getScoreBadge = (score: number) => {
  if (score >= 80) return { variant: 'default' as const, text: 'ممتاز' };
  if (score >= 60) return { variant: 'secondary' as const, text: 'جيد' };
  return { variant: 'destructive' as const, text: 'ضعيف' };
};

const evalLabels: Record<string, string> = {
  clarity: 'الوضوح',
  confidence: 'الثقة',
  relevance: 'الملاءمة',
  organization: 'التنظيم',
  engagement: 'التفاعل',
};

const LIMIT = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const HistoryPage = () => {
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedDetails, setSelectedDetails] = useState<SessionDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  // ─── Get current user from localStorage ───
  const getUserData = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();

  // ─── Fetch sessions ───────────────────────────────────────────────────────
  const fetchSessions = async (p: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/sessions/get-user-sessions?page=${p}&limit=${LIMIT}`
      );
      const data: SessionFromAPI[] = res.data.data;
      setSessions(data);
      setHasMore(data.length === LIMIT);
    } catch (err: any) {
      if (!err.isAuthError) {
        toast({
          title: 'خطأ في جلب الجلسات',
          description:
            err?.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات',
          variant: 'destructive',
        });
      }
      setSessions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page);
  }, [page]);

  // ─── View session details ─────────────────────────────────────────────────
  const handleViewDetails = async (session: SessionFromAPI) => {
    setDetailsLoading(true);
    setIsDialogOpen(true);
    setSelectedDetails(null);
    try {
      const res = await axiosInstance.get(
        `/sessions/session-details/${session._id}`
      );
      setSelectedDetails(res.data.data);
    } catch (err: any) {
      toast({
        title: 'خطأ في جلب التفاصيل',
        description:
          err?.response?.data?.message || 'تعذر تحميل تفاصيل الجلسة',
        variant: 'destructive',
      });
      setIsDialogOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedDetails(null);
  };

  // ─── Export statistics ────────────────────────────────────────────────────
  const handleExport = async (userId: string) => {
    setExportingId(userId);
    try {
      const res = await axiosInstance.get(
        `/sessions/export-user-statistics/${userId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_statistics.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'تم التصدير بنجاح',
        description: 'تم تحميل ملف الإحصائيات',
      });
    } catch {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير الإحصائيات',
        variant: 'destructive',
      });
    } finally {
      setExportingId(null);
    }
  };

  // ─── Client-side search filter ────────────────────────────────────────────
  const filteredSessions = sessions.filter((s) =>
    s.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Summary stats (from current page) ───────────────────────────────────
  const totalQuestions = sessions.reduce((acc, s) => acc + s.numberOfQuestions, 0);
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)
      : 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={user?.fullname || ''} />

      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              سجل الجلسات التدريبية
            </h1>
            <p className="text-xl text-muted-foreground">
              تتبع تقدمك وراجع أداءك في الجلسات السابقة
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center animate-fade-in">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-primary">
                  {loading ? '—' : sessions.length}
                </div>
                <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-success">
                  {loading ? '—' : `${avgScore}%`}
                </div>
                <p className="text-sm text-muted-foreground">متوسط التقييم</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-primary">
                  {loading ? '—' : totalMinutes}
                </div>
                <p className="text-sm text-muted-foreground">دقائق التدريب</p>
              </CardContent>
            </Card>
            <Card className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-success">
                  {loading ? '—' : totalQuestions}
                </div>
                <p className="text-sm text-muted-foreground">أسئلة أُجيبت</p>
              </CardContent>
            </Card>
          </div>

          {/* Search + Export */}
          <Card className="mb-8 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between space-x-2 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Search className="h-5 w-5 text-primary" />
                  <span>البحث في الجلسات</span>
                </div>
                {user?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(user.id)}
                    disabled={!!exportingId}
                    className="flex items-center gap-2"
                  >
                    {exportingId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    تصدير إحصائياتي
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالتخصص (مثال: برمجة، إدارة، طب...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              {searchTerm && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    عدد النتائج: {filteredSessions.length}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="text-xs"
                  >
                    مسح البحث
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جارٍ تحميل الجلسات...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card className="text-center py-12 animate-fade-in">
              <CardContent>
                <div className="text-muted-foreground mb-4">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? 'لا توجد نتائج' : 'لا توجد جلسات تدريبية'}
                  </h3>
                  <p>
                    {searchTerm
                      ? 'لم يتم العثور على جلسات تطابق بحثك. جرب كلمة بحث مختلفة.'
                      : 'لم تقم بأي جلسة تدريبية بعد. ابدأ جلستك الأولى الآن!'}
                  </p>
                </div>
                {searchTerm ? (
                  <Button onClick={() => setSearchTerm('')} variant="outline">
                    مسح البحث
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/setup')} className="btn-hero">
                    ابدأ جلسة جديدة
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Sessions List */}
              <div className="space-y-6">
                {filteredSessions.map((session, index) => (
                  <Card
                    key={session._id}
                    className="animate-fade-in hover:shadow-lg transition-shadow"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <Badge variant="outline">{session.specialization}</Badge>
                            <Badge variant="secondary">
                              {difficultyMap[session.difficultyLevel] ?? session.difficultyLevel}
                            </Badge>
                            {!session.ended && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                                نشطة
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {session.durationMinutes
                                  ? `${session.durationMinutes} دقيقة`
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">الأسئلة: </span>
                              <span className="font-medium">{session.numberOfQuestions}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">النتيجة: </span>
                              <span className={`font-bold ${getScoreColor(session.score)}`}>
                                {session.score}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <Badge {...getScoreBadge(session.score)}>
                            {getScoreBadge(session.score).text}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(session)}
                            disabled={!session.ended}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض التفاصيل
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {!searchTerm && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="flex items-center gap-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <span className="text-sm text-muted-foreground">صفحة {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Action Button */}
              <div className="text-center mt-12">
                <Button onClick={() => navigate('/setup')} className="btn-hero">
                  ابدأ جلسة جديدة
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              تفاصيل الجلسة
            </DialogTitle>
          </DialogHeader>

          {/* Loading state inside dialog */}
          {detailsLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground text-sm">جارٍ تحميل التفاصيل...</p>
            </div>
          )}

          {selectedDetails && !detailsLoading && (
            <div className="space-y-6">
              {/* Session Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="font-semibold text-sm">
                    {formatDate(selectedDetails.session.createdAt)}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">المدة</p>
                  <p className="font-semibold text-sm">
                    {selectedDetails.session.durationMinutes
                      ? `${selectedDetails.session.durationMinutes} دقيقة`
                      : '—'}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">الأسئلة</p>
                  <p className="font-semibold text-sm">
                    {selectedDetails.session.numberOfQuestions}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">النتيجة</p>
                  <p className={`font-bold text-lg ${getScoreColor(selectedDetails.session.score)}`}>
                    {selectedDetails.session.score}%
                  </p>
                </div>
              </div>

              {/* Field and Difficulty */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {selectedDetails.session.specialization}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {difficultyMap[selectedDetails.session.difficultyLevel] ??
                    selectedDetails.session.difficultyLevel}
                </Badge>
              </div>

              {/* AI Evaluation Breakdown */}
              {selectedDetails.session.aiEvaluation &&
                Object.keys(selectedDetails.session.aiEvaluation).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      تقييم الذكاء الاصطناعي
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selectedDetails.session.aiEvaluation).map(
                        ([key, val]) =>
                          val !== undefined && (
                            <div key={key} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">
                                  {evalLabels[key] ?? key}
                                </p>
                                <span
                                  className={`font-bold text-sm ${getScoreColor(val)}`}
                                >
                                  {val}%
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getScoreProgressColor(val)} transition-all`}
                                  style={{ width: `${val}%` }}
                                />
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}

              {/* Questions Performance */}
              {selectedDetails.questions && selectedDetails.questions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    أداء الأسئلة
                  </h4>
                  <div className="space-y-3">
                    {selectedDetails.questions.map((q, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium flex-1">{q.question}</p>
                          <span
                            className={`font-bold text-sm ${getScoreColor(q.score)}`}
                          >
                            {q.score}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getScoreProgressColor(q.score)} transition-all`}
                            style={{ width: `${q.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {selectedDetails.session.strengths &&
                selectedDetails.session.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-success">
                      <TrendingUp className="h-4 w-4" />
                      نقاط القوة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDetails.session.strengths.map((strength, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-success/10 text-success border-success/30"
                        >
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Areas for Improvement */}
              {selectedDetails.session.improvements &&
                selectedDetails.session.improvements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                      <Target className="h-4 w-4" />
                      مجالات التحسين
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDetails.session.improvements.map((item, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Soft Skills Recommendations */}
              {selectedDetails.session.softSkillsRecommendations &&
                selectedDetails.session.softSkillsRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                      <MessageSquare className="h-4 w-4" />
                      توصيات المهارات الناعمة
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedDetails.session.softSkillsRecommendations.map(
                        (rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Close Button */}
              <div className="pt-4 border-t">
                <Button onClick={closeDialog} className="w-full">
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default HistoryPage;