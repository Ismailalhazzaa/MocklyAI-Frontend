import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, TrendingUp, Users, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardUser {
  _id: string;
  fullname: string;
  averageScore: number;
  numberOfSessions: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAvatarLetters = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.slice(0, 2);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankBackground = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
    default:
      return 'bg-muted/30 border-transparent';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUser();

  const isMe = (user: LeaderboardUser | undefined): boolean =>
    !!currentUser?.id && !!user && user._id === currentUser.id;

  // ─── Fetch leaderboard ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/leaderboard/leaderboard-users');
        setLeaderboardData(res.data.data);
      } catch (err: any) {
        if (!err.isAuthError) {
          toast({
            title: 'خطأ في تحميل البيانات',
            description: err?.response?.data?.message || 'تعذر تحميل لوحة الصدارة',
            variant: 'destructive',
          });
        }
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جارٍ تحميل لوحة الصدارة...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (leaderboardData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={currentUser?.fullname || ''} />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">لوحة الصدارة</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">المستخدمون الأعلى تقييماً على المنصة</p>
          </div>
          <Card className="text-center py-16">
            <CardContent>
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد متصدرون بعد</h3>
              <p className="text-sm text-muted-foreground">
                يحتاج المستخدم إلى إكمال 10 جلسات أو أكثر للظهور في لوحة الصدارة
              </p>
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة الصدارة</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">المستخدمون الأعلى تقييماً على المنصة</p>
        </div>

        {/* ── Top 3 Podium ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* Second Place */}
          <Card className={`md:order-1 bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-gray-400/20 ${isMe(leaderboardData[1]) ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-400/20 flex items-center justify-center mx-auto mb-3">
                <Medal className="h-8 w-8 text-gray-400" />
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-gray-400/30">
                <AvatarFallback className="text-xl bg-gray-400/20">
                  {getAvatarLetters(leaderboardData[1]?.fullname ?? '؟')}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-foreground">
                {leaderboardData[1]?.fullname}
                {isMe(leaderboardData[1]) && (
                  <Badge variant="outline" className="mr-1 text-xs">أنت</Badge>
                )}
              </p>
              <p className="text-3xl font-bold text-gray-500 mt-1">{leaderboardData[1]?.averageScore}%</p>
              <p className="text-xs text-muted-foreground">{leaderboardData[1]?.numberOfSessions} جلسة</p>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className={`md:order-0 md:scale-110 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 z-10 ${isMe(leaderboardData[0]) ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-6 text-center">
              <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                <Crown className="h-10 w-10 text-yellow-500" />
              </div>
              <Avatar className="h-24 w-24 mx-auto mb-3 border-4 border-yellow-500/30">
                <AvatarFallback className="text-2xl bg-yellow-500/20">
                  {getAvatarLetters(leaderboardData[0]?.fullname ?? '؟')}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-xl text-foreground">
                {leaderboardData[0]?.fullname}
                {isMe(leaderboardData[0]) && (
                  <Badge variant="outline" className="mr-1 text-xs">أنت</Badge>
                )}
              </p>
              <p className="text-4xl font-bold text-yellow-500 mt-1">{leaderboardData[0]?.averageScore}%</p>
              <p className="text-xs text-muted-foreground">{leaderboardData[0]?.numberOfSessions} جلسة</p>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className={`md:order-2 bg-gradient-to-br from-amber-600/10 to-amber-600/5 border-amber-600/20 ${isMe(leaderboardData[2]) ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-600/20 flex items-center justify-center mx-auto mb-3">
                <Medal className="h-8 w-8 text-amber-600" />
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-amber-600/30">
                <AvatarFallback className="text-xl bg-amber-600/20">
                  {getAvatarLetters(leaderboardData[2]?.fullname ?? '؟')}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-lg text-foreground">
                {leaderboardData[2]?.fullname ?? '—'}
                {isMe(leaderboardData[2]) && (
                  <Badge variant="outline" className="mr-1 text-xs">أنت</Badge>
                )}
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {leaderboardData[2] ? `${leaderboardData[2].averageScore}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {leaderboardData[2] ? `${leaderboardData[2].numberOfSessions} جلسة` : ''}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشاركين</p>
                <p className="text-3xl font-bold text-foreground">{leaderboardData.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أعلى تقييم</p>
                <p className="text-3xl font-bold text-foreground">{leaderboardData[0]?.averageScore}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </CardContent>
          </Card>
        </div>

        {/* ── Full Leaderboard ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              الترتيب الكامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.map((user, index) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${getRankBackground(index + 1)} ${isMe(user) ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10">
                        {getAvatarLetters(user.fullname)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.fullname}
                        {isMe(user) && (
                          <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {user.numberOfSessions} جلسة مكتملة
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-2xl font-bold text-primary">{user.averageScore}%</p>
                    <p className="text-xs text-muted-foreground">{user.numberOfSessions} جلسة</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;