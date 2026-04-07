import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

import { 
  ArrowLeft, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AiEvaluation {
  clarity:      number;
  confidence:   number;
  relevance:    number;
  organization: number;
  engagement:   number;
}

interface AnalysisResult {
  score:        number;
  aiEvaluation: AiEvaluation;
  strengths:    string[];
  improvements: string[];
}

const getUserName = (): string => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) return JSON.parse(userData)?.fullname ?? 'مستخدم';
  } catch { /* ignore */ }
  return 'مستخدم';
};

const AnalysisPage = () => {
  const [isAnalyzing, setIsAnalyzing]     = useState(true);
  const [analysisData, setAnalysisData]   = useState<AnalysisResult | null>(null);
  const [progressValue, setProgressValue] = useState(10);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  // ─── Destructure state from QuestionPage ───
  const {
    sessionId,
    sessionData,              // full session meta (sessionId, field, questionCount, questionTypes, difficulty)
    currentQuestionNumber,
    questionData,
    analysisData: passedAnalysisData,
    isLastQuestion,
  } = (location.state ?? {}) as {
    sessionId?:            string;
    sessionData?:          any;
    currentQuestionNumber?: number;
    questionData?:         { _id: string; questionText: string; category: string };
    analysisData?:         AnalysisResult;
    isLastQuestion?:       boolean;
  };

  // ─── Animate progress bar ───
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setProgressValue(prev => Math.min(prev + 20, 90));
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // ─── Load pre-fetched analysis data (no second API call) ───
  useEffect(() => {
    if (passedAnalysisData) {
      const timer = setTimeout(() => {
        setAnalysisData(passedAnalysisData);
        setProgressValue(100);
        setIsAnalyzing(false);
        toast({ title: 'اكتمل التحليل', description: 'تم تحليل إجابتك بنجاح' });
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // No data passed – shouldn't happen normally
      setIsAnalyzing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Next question: navigate back to QuestionPage ───
  const handleNextQuestion = () => {
    const nextNumber = (currentQuestionNumber ?? 1) + 1;

    // Pass sessionData (which has sessionId inside) PLUS the next question number explicitly
    // QuestionPage reads sessionId from sessionData OR from top-level, both work
    navigate('/question', {
      state: {
        // Spread all session meta so QuestionPage can rebuild sessionMeta
        ...(sessionData ?? {}),
        sessionId:            sessionId ?? sessionData?.sessionId,
        _nextQuestionNumber:  nextNumber,
      }
    });
  };

  // ─── End session → go to summary ───
  const handleEndSession = () => {
    navigate('/summary', {
      state: {
        sessionId: sessionId ?? sessionData?.sessionId,
        sessionData,
        completedQuestions: currentQuestionNumber ?? 1,
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'ممتاز' };
    if (score >= 60) return { variant: 'secondary' as const, text: 'جيد' };
    return { variant: 'destructive' as const, text: 'يحتاج تحسين' };
  };

  // ─── Loading screen ───
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={getUserName()} />
        <div className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">جاري تحليل إجابتك...</h1>
            <p className="text-xl text-muted-foreground mb-8">
              يقوم الذكاء الاصطناعي بتقييم أدائك
            </p>
            <div className="max-w-md mx-auto">
              <Progress value={progressValue} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">معالجة البيانات...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── No data fallback ───
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={getUserName()} />
        <div className="pt-20 pb-16 px-4 text-center">
          <p className="text-muted-foreground mt-20">تعذر تحميل بيانات التحليل</p>
          <Button className="mt-6" onClick={() => navigate('/setup')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={getUserName()} />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">تحليل الإجابة</h1>
            <p className="text-xl text-muted-foreground">
              إليك تحليل مفصل لإجابتك مع اقتراحات للتحسين
            </p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8 animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysisData.score)}`}>
                {analysisData.score}
              </div>
              <div className="text-xl text-muted-foreground mb-4">التقييم العام</div>
              <Badge {...getScoreBadge(analysisData.score)} className="text-lg px-4 py-2">
                {getScoreBadge(analysisData.score).text}
              </Badge>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="animate-fade-in mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>تفاصيل التقييم</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { label: 'الوضوح',    value: analysisData.aiEvaluation.clarity },
                  { label: 'الثقة',     value: analysisData.aiEvaluation.confidence },
                  { label: 'الملاءمة',  value: analysisData.aiEvaluation.relevance },
                  { label: 'التنظيم',   value: analysisData.aiEvaluation.organization },
                  { label: 'التفاعل',   value: analysisData.aiEvaluation.engagement },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm font-bold text-primary">{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Strengths */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span>نقاط القوة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisData.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {analysisData.strengths.map((s, i) => (
                      <li key={i} className="flex items-start space-x-3 space-x-reverse">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">لا توجد نقاط قوة محددة في هذه الإجابة</p>
                )}
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>مجالات التحسين</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisData.improvements.length > 0 ? (
                  <ul className="space-y-3">
                    {analysisData.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start space-x-3 space-x-reverse">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{imp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">أداء ممتاز! لا توجد توصيات للتحسين</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question context */}
          {questionData && (
            <Card className="mb-8 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>السؤال الذي أجبت عليه</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-card-accent p-6 rounded-xl">
                  <p className="text-foreground leading-relaxed text-lg">
                    {questionData.questionText}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            {!isLastQuestion && (
              <Button onClick={handleNextQuestion} className="btn-hero">
                السؤال التالي
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant={isLastQuestion ? 'default' : 'outline'}
              onClick={handleEndSession}
              className={isLastQuestion ? 'btn-hero' : 'btn-outline-hero'}
            >
              إنهاء الجلسة وعرض الملخص
            </Button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              * التحليل يتم باستخدام الذكاء الاصطناعي وقد لا يعكس جميع جوانب الأداء
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;