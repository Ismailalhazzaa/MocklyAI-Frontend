import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { 
  GraduationCap,
  ArrowLeft,
  Settings,
  Clock,
  MessageSquare,
  Mic
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helper: map frontend difficulty values → backend enum (capitalized)
// ─────────────────────────────────────────────
const mapDifficulty = (value: string): string => {
  const map: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return map[value] ?? 'Intermediate';
};

// ─────────────────────────────────────────────
// Helper: get logged-in user's display name from localStorage
// ─────────────────────────────────────────────
const getUserName = (): string => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed?.fullname ?? 'مستخدم';
    }
  } catch {
    // ignore
  }
  return 'مستخدم';
};

const SetupPage = () => {
  const [selectedField, setSelectedField] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['text']);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const questionCounts = [
    { value: '3', label: '3 أسئلة (سريع)' },
    { value: '5', label: '5 أسئلة (متوسط)' },
    { value: '10', label: '10 أسئلة (شامل)' },
    { value: '15', label: '15 سؤال (مكثف)' },
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'مبتدئ', description: 'أسئلة أساسية ومبسطة' },
    { value: 'intermediate', label: 'متوسط', description: 'أسئلة متوازنة ومتنوعة' },
    { value: 'advanced', label: 'متقدم', description: 'أسئلة تحدي ومعقدة' },
  ];

  const handleQuestionTypeToggle = (type: string) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleStartSession = async () => {
    // ─── Client-side validation ───
    if (!selectedField || selectedField.trim() === '') {
      toast({
        title: 'يرجى إدخال التخصص',
        description: 'يجب إدخال مجال التخصص قبل البدء',
        variant: 'destructive',
      });
      return;
    }

    if (questionTypes.length === 0) {
      toast({
        title: 'يرجى اختيار نوع الأسئلة',
        description: 'يجب اختيار نوع واحد على الأقل من الأسئلة',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // ─── API: POST /api/sessions/create-session ───
      const response = await axiosInstance.post('/sessions/create-session', {
        specialization: selectedField.trim(),
        numberOfQuestions: parseInt(questionCount),
        questionTypes,                         // ["text"] | ["voice"] | ["text","voice"]
        difficultyLevel: mapDifficulty(difficulty), // Backend expects: "Beginner"|"Intermediate"|"Advanced"
      });

      // Backend returns: { status: "SUCCESS", data: "...", sessionId: "..." }
      const sessionId: string = response.data.sessionId;

      toast({
        title: 'تم إنشاء الجلسة بنجاح',
        description: 'ستبدأ مقابلتك التدريبية الآن',
      });

      if (questionTypes.includes('voice')) {
        setTimeout(() => {
          toast({
            title: 'ملاحظة هامة للإجابة الصوتية',
            description: 'يرجى الجلوس في مكان هادئ واستخدام مايكروفون جيد لضمان التحليل الجيد للإجابة الصوتية',
          });
        }, 5000);
      }

      // ─── Navigate to QuestionPage, passing session metadata ───
      navigate('/question', {
        state: {
          sessionId,                          // ← core ID used in all subsequent API calls
          field: selectedField.trim(),
          questionCount: parseInt(questionCount),
          questionTypes,
          difficulty,
        }
      });

    } catch (err: any) {
      toast({
        title: 'حدث خطأ',
        description: err?.response?.data?.message || 'لم نتمكن من إنشاء الجلسة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={getUserName()} />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              إعداد جلسة تدريبية جديدة
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              اختر التخصص ونوع الأسئلة لنولد لك مقابلة تدريبية مخصصة
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Field Input */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span>اختر مجال التخصص</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="field-input" className="text-sm font-medium">
                      أدخل مجال التخصص
                    </Label>
                    <Input
                      id="field-input"
                      type="text"
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      placeholder="مثال: تطوير الويب، إدارة المشاريع، التسويق الرقمي..."
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      حدد مجال تخصصك أو الوظيفة التي تستعد للمقابلة بها
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Question Configuration */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>إعدادات الأسئلة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Count */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">عدد الأسئلة</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {questionCounts.map((count) => (
                        <div
                          key={count.value}
                          onClick={() => setQuestionCount(count.value)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                            questionCount === count.value 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium">{count.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Types */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">نوع الأسئلة</Label>
                    <div className="space-y-3">
                      <div 
                        onClick={() => handleQuestionTypeToggle('text')}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          questionTypes.includes('text') 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">إجابات نصية</div>
                            <div className="text-sm text-muted-foreground">أجب على الأسئلة كتابياً</div>
                          </div>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleQuestionTypeToggle('voice')}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          questionTypes.includes('voice') 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Mic className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">إجابات صوتية</div>
                            <div className="text-sm text-muted-foreground">أجب على الأسئلة بصوتك</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">مستوى الصعوبة</Label>
                    <div className="space-y-2">
                      {difficultyLevels.map((level) => (
                        <div
                          key={level.value}
                          onClick={() => setDifficulty(level.value)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            difficulty === level.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{level.label}</div>
                              <div className="text-sm text-muted-foreground">{level.description}</div>
                            </div>
                            {difficulty === level.value && (
                              <Badge variant="secondary">محدد</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Summary Sidebar */}
            <div className="space-y-6">
              <Card className="animate-fade-in sticky top-24" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>ملخص الجلسة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">التخصص</Label>
                    <p className="font-medium">
                      {selectedField || 'لم يتم الاختيار'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">عدد الأسئلة</Label>
                    <p className="font-medium">{questionCount} أسئلة</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">نوع الإجابة</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {questionTypes.map(type => (
                        <Badge key={type} variant="secondary">
                          {type === 'text' ? 'نصية' : 'صوتية'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">مستوى الصعوبة</Label>
                    <p className="font-medium">
                      {difficultyLevels.find(d => d.value === difficulty)?.label}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm text-muted-foreground">الوقت المتوقع</Label>
                    <p className="font-medium text-primary">
                      {parseInt(questionCount) * 3} - {parseInt(questionCount) * 5} دقائق
                    </p>
                  </div>

                  <Button
                    onClick={handleStartSession}
                    disabled={isLoading || !selectedField || selectedField.trim() === '' || questionTypes.length === 0}
                    className="w-full btn-hero mt-6"
                  >
                    {isLoading ? 'جاري الإعداد...' : 'ابدأ الجلسة'}
                    {!isLoading && <ArrowLeft className="mr-2 h-4 w-4" />}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    يمكنك تعديل الإعدادات في أي وقت أثناء الجلسة
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SetupPage;