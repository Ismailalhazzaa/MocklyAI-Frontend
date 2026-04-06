import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';

import { 
  Mic, 
  MicOff, 
  Send, 
  Clock, 
  MessageSquare,
  Volume2,
  Loader2
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface QuestionData {
  _id: string;
  questionText: string;
  category: 'general' | 'behavioral' | 'technical';
}

// Shape of the session metadata stored in sessionStorage
interface SessionMeta {
  sessionId: string;
  field: string;
  questionCount: number;
  questionTypes: string[];
  difficulty: string;
}

const SESSION_STORAGE_KEY = 'mockly_session';

const getUserName = (): string => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) return JSON.parse(userData)?.fullname ?? 'مستخدم';
  } catch { /* ignore */ }
  return 'مستخدم';
};

const categoryLabel: Record<string, string> = {
  general: 'عام',
  behavioral: 'سلوكي',
  technical: 'تقني',
};

const QuestionPage = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { toast }   = useToast();

  // ─────────────────────────────────────────────
  // Resolve session metadata:
  // Priority 1 → location.state (fresh arrival from SetupPage or AnalysisPage)
  // Priority 2 → sessionStorage  (page refresh / direct URL fallback)
  // ─────────────────────────────────────────────
  const sessionMeta: SessionMeta | null = (() => {
    // location.state can come from SetupPage with full data
    const ls = location.state as any;
    if (ls?.sessionId) {
      const meta: SessionMeta = {
        sessionId:     ls.sessionId,
        field:         ls.field         ?? ls.sessionData?.field         ?? '',
        questionCount: ls.questionCount ?? ls.sessionData?.questionCount ?? 5,
        questionTypes: ls.questionTypes ?? ls.sessionData?.questionTypes ?? ['text'],
        difficulty:    ls.difficulty    ?? ls.sessionData?.difficulty    ?? 'intermediate',
      };
      // Persist to sessionStorage so refresh still works
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(meta));
      return meta;
    }
    // Fallback: read from sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as SessionMeta;
    } catch { /* ignore */ }
    return null;
  })();

  // currentQuestionNumber: passed explicitly from AnalysisPage or default to 1
  const initialQuestionNumber = (() => {
    const ls = location.state as any;
    // When AnalysisPage navigates back it sets _nextQuestionNumber
    if (ls?._nextQuestionNumber) return ls._nextQuestionNumber as number;
    return 1;
  })();

  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(initialQuestionNumber);
  const [questionData, setQuestionData]   = useState<QuestionData | null>(null);
  const [answer, setAnswer]               = useState('');
  const [isRecording, setIsRecording]     = useState(false);
  const [audioBlob, setAudioBlob]         = useState<Blob | null>(null);
  const [timeSpent, setTimeSpent]         = useState(0);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  // Guard ref to prevent double-fetch in React dev/StrictMode
  const fetchCalledRef   = useRef(false);

  // ─── Guard: no session → redirect ───
  useEffect(() => {
    if (!sessionMeta?.sessionId) {
      toast({
        title: 'لا توجد جلسة نشطة',
        description: 'يرجى إنشاء جلسة جديدة أولاً',
        variant: 'destructive',
      });
      navigate('/setup', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId     = sessionMeta?.sessionId ?? '';
  const questionCount = sessionMeta?.questionCount ?? 5;
  const questionTypes = sessionMeta?.questionTypes ?? ['text'];
  const progress      = (currentQuestionNumber / questionCount) * 100;

  // ─── Fetch question (called once per mount, guarded by ref) ───
  const fetchQuestion = async (sid: string) => {
    setIsLoadingQuestion(true);
    setAnswer('');
    setAudioBlob(null);
    setTimeSpent(0);

    try {
      const response = await axiosInstance.get(`/questions/create-question/${sid}`);
      const question: QuestionData = response.data.data;
      setQuestionData(question);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message || 'حدث خطأ أثناء جلب السؤال';

      if (status === 400 && msg.includes('الحد الأقصى')) {
        // All questions answered – go to summary
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        navigate('/summary', {
          state: { sessionId: sid, sessionData: sessionMeta, completedQuestions: currentQuestionNumber - 1 }
        });
        return;
      }

      toast({ title: 'خطأ في جلب السؤال', description: msg, variant: 'destructive' });
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    if (fetchCalledRef.current) return;   // prevent double-call in StrictMode / re-render
    fetchCalledRef.current = true;
    fetchQuestion(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Timer – resets whenever a new question is loaded
  useEffect(() => {
    if (!questionData) return;
    setTimeSpent(0);
    const timer = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [questionData?._id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Voice recording ───
  const handleRecordToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      toast({ title: 'تم إيقاف التسجيل', description: 'تم حفظ إجابتك الصوتية' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current   = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({ title: 'بدأ التسجيل', description: 'تحدث بوضوح واشرح إجابتك' });
      } catch {
        toast({ title: 'تعذر الوصول للمايكروفون', variant: 'destructive' });
      }
    }
  };

  // ─── Submit answer ───
  const handleSubmitAnswer = async () => {
    if (!questionData) return;

    const hasVoice = questionTypes.includes('voice');
    const hasText  = questionTypes.includes('text');

    // ── Validation ──
    // If voice is enabled and user recorded → send voice (regardless of text mode)
    // If voice is enabled but nothing recorded and no text fallback → block
    if (hasVoice && !audioBlob && !hasText) {
      toast({ title: 'يرجى تسجيل إجابتك الصوتية', variant: 'destructive' });
      return;
    }
    // If only text mode → require text
    if (!hasVoice && !answer.trim()) {
      toast({ title: 'يرجى كتابة إجابتك', variant: 'destructive' });
      return;
    }
    // Both modes enabled but nothing provided at all
    if (hasVoice && hasText && !audioBlob && !answer.trim()) {
      toast({ title: 'يرجى كتابة إجابتك أو تسجيل إجابة صوتية', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const isLastQuestion = currentQuestionNumber >= questionCount;

    try {
      let analysisData: any;

      // Priority: audioBlob (voice) > text answer
      if (audioBlob) {
        // ── Voice answer ──
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.webm');
        formData.append('answerType', 'voice');
        const response = await axiosInstance.post(
          `/questions/analysis-answer/${questionData._id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        analysisData = response.data.data;
      } else {
        // ── Text answer ──
        const response = await axiosInstance.post(`/questions/analysis-answer/${questionData._id}`, {
          answerType: 'text',
          answertext: answer,   // backend reads req.body.answertext
        });
        analysisData = response.data.data;
      }

      toast({ title: 'تم إرسال الإجابة', description: 'جاري التحليل...' });

      navigate('/analysis', {
        state: {
          sessionId,
          sessionData: sessionMeta,
          currentQuestionNumber,
          questionData,
          answer,
          timeSpent,
          isLastQuestion,
          analysisData,
        }
      });

    } catch (err: any) {
      toast({
        title: 'خطأ في إرسال الإجابة',
        description: err?.response?.data?.message || 'يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading screen ───
  if (isLoadingQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={getUserName()} />
        <div className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">جاري تحضير السؤال...</h1>
            <p className="text-muted-foreground">يقوم الذكاء الاصطناعي بإنشاء سؤال مخصص لتخصصك</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={getUserName()} />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">

          {/* Progress Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Badge variant="secondary">
                  السؤال {currentQuestionNumber} من {questionCount}
                </Badge>
                <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(timeSpent)}</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Question Card */}
            <div className="lg:col-span-2">
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 space-x-reverse">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>سؤال المقابلة</span>
                    {questionData?.category && (
                      <Badge variant="outline" className="mr-auto">
                        {categoryLabel[questionData.category] ?? questionData.category}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Question Text */}
                  <div className="p-6 bg-card-accent rounded-xl">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        Q
                      </div>
                      <p className="text-lg leading-relaxed text-foreground">
                        {questionData?.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">إجابتك</h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {questionTypes.includes('voice') && (
                          <Button
                            variant={isRecording ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={handleRecordToggle}
                          >
                            {isRecording ? (
                              <><MicOff className="h-4 w-4 ml-1" />إيقاف التسجيل</>
                            ) : (
                              <><Mic className="h-4 w-4 ml-1" />تسجيل صوتي</>
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Text area: show when text mode enabled AND no audio recorded yet */}
                    {questionTypes.includes('text') && !audioBlob && (
                      <Textarea
                        placeholder="اكتب إجابتك هنا..."
                        value={answer}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                        className="min-h-32 text-lg leading-relaxed"
                        disabled={isRecording}
                      />
                    )}

                    {isRecording && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-4 h-4 bg-destructive rounded-full animate-pulse" />
                          <span className="text-destructive font-medium">جاري التسجيل...</span>
                        </div>
                        <div className="mt-2 flex space-x-1 space-x-reverse">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="w-1 bg-destructive rounded-full animate-pulse"
                              style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {audioBlob && !isRecording && (
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Mic className="h-4 w-4 text-success" />
                          <span className="text-success text-sm font-medium">تم تسجيل الإجابة الصوتية ✓</span>
                        </div>
                        {/* Allow re-recording or switching to text when both modes are enabled */}
                        {questionTypes.includes('text') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive text-xs"
                            onClick={() => setAudioBlob(null)}
                          >
                            حذف التسجيل والكتابة بدلاً منه
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        الوقت المستغرق: {formatTime(timeSpent)}
                      </p>
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={
                          isSubmitting ||
                          isRecording  ||
                          // voice-only mode: need a recording
                          (questionTypes.includes('voice') && !questionTypes.includes('text') && !audioBlob) ||
                          // text-only mode: need text
                          (!questionTypes.includes('voice') && !answer.trim()) ||
                          // both modes: need at least one of them
                          (questionTypes.includes('voice') && questionTypes.includes('text') && !audioBlob && !answer.trim())
                        }
                        className="btn-hero"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الإرسال...</>
                        ) : (
                          <>{currentQuestionNumber < questionCount ? 'السؤال التالي' : 'إنهاء وتحليل'}<Send className="mr-2 h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24 animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-lg">معلومات الجلسة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">التخصص</p>
                    <p className="font-medium">{sessionMeta?.field || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مستوى الصعوبة</p>
                    <Badge variant="secondary">{sessionMeta?.difficulty || 'متوسط'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التقدم</p>
                    <p className="font-medium">{currentQuestionNumber} من {questionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
                    <p className="font-medium text-primary">{formatTime(timeSpent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">نوع الإجابة</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {questionTypes.map(t => (
                        <Badge key={t} variant="outline">{t === 'text' ? 'نصية' : 'صوتية'}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">نصائح للإجابة</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• كن واضحاً ومحدداً في إجابتك</li>
                    <li>• استخدم أمثلة من خبرتك الشخصية</li>
                    <li>• تحدث بثقة ووضوح</li>
                    <li>• خذ وقتك في التفكير قبل الإجابة</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;