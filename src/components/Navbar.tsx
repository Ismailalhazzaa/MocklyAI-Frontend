import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';



interface NavbarProps {
  isAuthenticated?: boolean;
  userName?: string;
}

const Navbar = ({ isAuthenticated = false, userName }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useLocation();
  const navigate  = useNavigate();
  const { toast } = useToast();


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'المميزات', href: '#features', isHash: true },
    { name: 'كيف تعمل', href: '#how-it-works', isHash: true },
    { name: 'تواصل معنا', href: '#contact', isHash: true },
  ];

  const authLinks = [
    { name: 'الرئيسية', href: '/', isHash: false },
    { name: 'لوحة التحكم', href: '/dashboard', isHash: false },
    { name: 'سجل الجلسات', href: '/history', isHash: false },
    { name: 'الأسئلة المتكررة', href: '/faq', isHash: false },
    { name: 'لوحة الصدارة', href: '/leaderboard', isHash: false },
    { name: 'حسابي', href: '/profile', isHash: false },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1); // Remove the '#' part
      
      // If we're not on home page, navigate there first
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // We're already on home page, just scroll
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  // ─── Logout ───
  const handleLogout = async () => {
    setIsLoggingOut(true);

    // 1. Snapshot token then immediately clear local state
    //    → request interceptor won't attach token to any new requests
    let token: string | null = null;
    try {
      const userData = localStorage.getItem('user');
      if (userData) token = JSON.parse(userData)?.token ?? null;
    } catch { /* ignore */ }

    localStorage.removeItem('user');
    sessionStorage.removeItem('mockly_session');

    // 2. Notify backend to invalidate the token in the DB
    try {
      if (token) {
        await axiosInstance.get('/users/logout', {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* local state already cleared — enough to prevent further requests */ }

    // 3. Show success toast and wait briefly so the user sees it before redirect
    toast({
      title: 'تم تسجيل الخروج بنجاح',
      description: 'نراك قريباً! 👋',
      duration: 2000,
    });

    // 4. Short delay so the toast renders, then redirect
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsLoggingOut(false);
    navigate('/login', { replace: true });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'navbar-glass shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/image-upload/201643e7-f106-4e70-b66d-0f1bf2e1d5d7.png" 
              alt="MocklyAI Logo" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-foreground">MocklyAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated ? (
              // Authenticated navigation
              <>
                {authLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === link.href ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                <div className="flex items-center gap-3">
                  <ThemeToggle />

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{userName || 'المستخدم'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoggingOut}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1"
                    onClick={handleLogout}
                  >
                    {isLoggingOut
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <LogOut className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                    }
                    {isLoggingOut ? 'جاري الخروج...' : 'تسجيل خروج'}
                  </Button>
                </div>
              </>
            ) : (
              // Public navigation
              <>
                {navLinks.map((link) => (
                  link.isHash ? (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  )
                ))}
                
                <div className="flex items-center gap-3">
                  <ThemeToggle />

                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="hover:bg-accent">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="btn-hero">
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <ThemeToggle />

            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hover:bg-accent">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="btn-hero">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{userName || 'المستخدم'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoggingOut}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  {isLoggingOut
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <LogOut className="h-4 w-4" />
                  }
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-popover border-t border-border shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {(isAuthenticated ? authLinks : navLinks).map((link) => (
                (link.isHash !== undefined ? link.isHash : !link.href.startsWith('/')) ? (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      handleNavClick(e, link.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-base font-medium text-popover-foreground hover:text-primary hover:bg-accent transition-colors rounded-md"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-3 py-2 text-base font-medium text-popover-foreground hover:text-primary hover:bg-accent transition-colors rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              
              {!isAuthenticated && (
                <div className="px-3 py-2 space-y-2">
                  <div className="flex gap-2 mb-2">
                    <ThemeToggle />
  
                  </div>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full btn-hero">
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              )}
              
              {isAuthenticated && (
                <div className="px-3 py-2 space-y-2 border-t border-border mt-2 pt-2">
                  <div className="flex gap-2 mb-2">
                    <ThemeToggle />
  
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-popover-foreground">{userName || 'المستخدم'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={isLoggingOut}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    {isLoggingOut
                      ? <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                      : <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    }
                    {isLoggingOut ? 'جاري الخروج...' : 'تسجيل خروج'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;