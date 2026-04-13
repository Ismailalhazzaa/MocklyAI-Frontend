import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';

import { User, Mail, Lock, BarChart3, Calendar, Trophy, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  numberOfSessions: number;
  averageScore: number;
  totalTrainingMinutes: number;
  bestSessionScore: number;
  improvmentRate: number;
  latestUserSession: {
    specialization: string;
    score: number;
    createdAt: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // User info — seeded from localStorage, updated on save
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();

  const [userData, setUserData] = useState({
    fullName: storedUser?.fullname ?? '',
    email: storedUser?.email ?? '',
    joinDate: '',   // not available in localStorage; left blank
  });

  // Editable copy so we can cancel without overwriting
  const [editName, setEditName] = useState(userData.fullName);

  const [stats, setStats] = useState<DashboardData | null>(null);

  const { toast } = useToast();

  // ─── Fetch dashboard stats ────────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axiosInstance.get('/dashboard/user-dashboard');
        setStats(res.data.data);
      } catch (err: any) {
        // 400 = no sessions yet → show zeroes, not an error toast
        if (err?.response?.status !== 400 && !err.isAuthError) {
          toast({
            title: 'خطأ في تحميل الإحصائيات',
            description: err?.response?.data?.message || 'تعذر تحميل إحصائياتك',
            variant: 'destructive',
          });
        }
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ─── Start editing ────────────────────────────────────────────────────────
  const handleStartEdit = () => {
    setEditName(userData.fullName);
    setIsEditing(true);
  };

  // ─── Cancel editing ───────────────────────────────────────────────────────
  const handleCancel = () => {
    setEditName(userData.fullName);
    setIsEditing(false);
  };

  // ─── Save name via API ────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast({
        title: 'الاسم مطلوب',
        description: 'يرجى إدخال الاسم الكامل',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await axiosInstance.put('/users/update-user', { fullname: trimmed });

      // Update local state + localStorage
      setUserData((prev) => ({ ...prev, fullName: trimmed }));
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem('user', JSON.stringify({ ...stored, fullname: trimmed }));
      }

      setIsEditing(false);
      toast({
        title: 'تم حفظ التغييرات',
        description: 'تم تحديث معلومات حسابك بنجاح',
      });
    } catch (err: any) {
      if (!err.isAuthError) {
        toast({
          title: 'فشل الحفظ',
          description: err?.response?.data?.message || 'حدث خطأ أثناء تحديث الاسم',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render stats values (fallback to 0 if no sessions) ──────────────────
  const totalSessions   = stats?.numberOfSessions       ?? 0;
  const averageScore    = stats?.averageScore            ?? 0;
  const totalTime       = stats?.totalTrainingMinutes    ?? 0;
  const bestScore       = stats?.bestSessionScore        ?? 0;
  const latestField     = stats?.latestUserSession?.specialization ?? null;

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} userName={userData.fullName} />

      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              حسابي الشخصي
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة معلوماتك الشخصية ومتابعة إحصائياتك
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Profile Info ── */}
            <div className="lg:col-span-2">
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle>معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={isEditing ? editName : userData.fullName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Email — always disabled */}
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      disabled
                    />
                  </div>

                  {/* Join Date — available if fetched */}
                  {userData.joinDate && (
                    <div className="space-y-2">
                      <Label>تاريخ الانضمام</Label>
                      <Input value={userData.joinDate} disabled />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          className="btn-hero"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              جارٍ الحفظ...
                            </>
                          ) : (
                            'حفظ التغييرات'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          إلغاء
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleStartEdit} variant="outline">
                        تعديل البيانات
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Statistics ── */}
            <div className="space-y-6">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>إحصائياتي</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{totalSessions}</div>
                        <p className="text-sm text-muted-foreground">جلسات تدريبية</p>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{averageScore}%</div>
                        <p className="text-sm text-muted-foreground">متوسط التقييم</p>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{totalTime}</div>
                        <p className="text-sm text-muted-foreground">دقائق التدريب</p>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{bestScore}%</div>
                        <p className="text-sm text-muted-foreground">أفضل نتيجة</p>
                      </div>

                      {latestField && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">آخر تخصص تدرّب عليه</p>
                          <Badge variant="secondary">{latestField}</Badge>
                        </div>
                      )}

                      {totalSessions === 0 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          لم تبدأ أي جلسة بعد
                        </p>
                      )}
                    </>
                  )}
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

export default ProfilePage;