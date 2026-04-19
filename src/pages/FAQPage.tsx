import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopQuestion {
  _id: string;           // canonicalText
  questionText: string;
  count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const FAQPage = () => {
  const [searchQuery, setSearchQuery]           = useState('');
  const [specialization, setSpecialization]     = useState('');
  const [questions, setQuestions]               = useState<TopQuestion[]>([]);
  const [loading, setLoading]                   = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // ─── Fetch ──────────────────────────────────────────────────────────────
  const fetchQuestions = async (spec?: string) => {
    setLoading(true);
    try {
      const params = spec ? { specialization: spec } : {};
      const res = await axiosInstance.get('/questions/most-frequently-questions', { params });
      setQuestions(res.data.data);
    } catch (err: any) {
      if (!err.isAuthError) {
        toast({
          title: 'خطأ في تحميل البيانات',
          description: err?.response?.data?.message || 'تعذر تحميل الأسئلة',
          variant: 'destructive',
        });
      }
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ─── Filter by specialization ────────────────────────────────────────────
  const handleSpecializationSearch = () => {
    fetchQuestions(specialization.trim() || undefined);
  };

  const handleClearFilter = () => {
    setSpecialization('');
    fetchQuestions();
  };

  // ─── Client-side search on questionText ──────────────────────────────────
  const filtered = questions.filter(q =>
    q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = questions.reduce((acc, q) => acc + q.count, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">الأسئلة الأكثر تكراراً</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اطلع على الأسئلة الأكثر شيوعاً في مقابلات العمل وتدرب عليها
          </p>
        </div>

        {/* ── Search by text ── */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في نص السؤال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Filter by specialization ── */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-foreground mb-3">فلترة حسب التخصص</p>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="مثال: برمجة، طب، إدارة..."
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSpecializationSearch()}
                className="flex-1"
              />
              <Button onClick={handleSpecializationSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}
              </Button>
              {specialization && (
                <Button variant="outline" onClick={handleClearFilter}>
                  مسح
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '—' : questions.length}
              </p>
              <p className="text-sm text-muted-foreground">إجمالي الأسئلة</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '—' : totalCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">مرة تم السؤال</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '—' : questions[0]?.count.toLocaleString() ?? '0'}
              </p>
              <p className="text-sm text-muted-foreground">أعلى عدد تكرار</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Questions List ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              الأسئلة الأكثر تكراراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">جارٍ تحميل الأسئلة...</p>
              </div>
            )}

            {/* Results */}
            {!loading && (
              <div className="space-y-4">
                {filtered.map((q, index) => (
                  <div
                    key={q._id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{q.questionText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {q._id || 'عام'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0 mr-4">
                      <p className="text-lg font-bold text-primary">{q.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">مرة</p>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground">
                      {searchQuery || specialization ? 'لا توجد نتائج' : 'لا توجد أسئلة بعد'}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {searchQuery || specialization
                        ? 'جرب البحث بكلمات مختلفة أو امسح الفلتر'
                        : 'ستظهر الأسئلة هنا بعد إجراء جلسات تدريبية'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;