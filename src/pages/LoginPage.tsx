import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: object) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль не менее 6 символов'),
});

const registerSchema = z.object({
  display_name: z.string().min(2, 'Имя не менее 2 символов').max(50),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль не менее 6 символов'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, loginWithGoogle, isAuthenticated } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const _googleButtonRef = useRef<HTMLDivElement>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { display_name: '', email: '', password: '', confirm_password: '' },
  });

  // Handle Yandex OAuth callback tokens
  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Ошибка авторизации через Яндекс');
      return;
    }

    if (access_token && refresh_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      window.location.replace('/');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setGoogleLoading(true);
          try {
            await loginWithGoogle(response.credential);
            navigate('/', { replace: true });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ошибка входа через Google');
          } finally {
            setGoogleLoading(false);
          }
        },
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.querySelector('script[src*="gsi/client"]');
      if (script) {
        script.addEventListener('load', initGoogle);
      }
    }
  }, [loginWithGoogle, navigate]);

  const onLogin = async (data: LoginFormData) => {
    setLoginLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setRegisterLoading(true);
    try {
      await register(data.email, data.password, data.display_name);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth не настроен');
      return;
    }
    if (window.google?.accounts?.id) {
      setGoogleLoading(true);
      window.google.accounts.id.prompt();
      setTimeout(() => setGoogleLoading(false), 3000);
    } else {
      toast.error('Google Sign-In не загружен');
    }
  };

  const handleYandexLogin = () => {
    window.location.href = API_URL + '/auth/yandex';
  };

  return (
    <div
      style={{ background: 'hsl(240, 33%, 4%)' }}
      className="min-h-screen flex flex-col items-center justify-center p-4"
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #7C3AED 100%)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h10M4 18h7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="19" cy="17" r="3" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <span
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: 'hsl(255, 8%, 85%)', letterSpacing: '0.2em' }}
          >
            THREADLINE
          </span>
        </div>
        <p style={{ color: 'hsl(255, 8%, 55%)' }} className="text-sm">
          Визуальный редактор диалогов
        </p>
      </div>

      {/* Card */}
      <Card
        className="w-full max-w-md border"
        style={{
          background: 'hsl(240, 20%, 9%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        <Tabs defaultValue="login">
          <CardHeader className="pb-2">
            <TabsList
              className="w-full"
              style={{ background: 'hsl(240, 25%, 6%)' }}
            >
              <TabsTrigger
                value="login"
                className="flex-1 data-[state=active]:text-white"
                style={{ color: 'hsl(255, 8%, 55%)' }}
              >
                Войти
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 data-[state=active]:text-white"
                style={{ color: 'hsl(255, 8%, 55%)' }}
              >
                Зарегистрироваться
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* LOGIN TAB */}
          <TabsContent value="login">
            <CardContent className="space-y-4 pt-2">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...loginForm.register('email')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: loginForm.formState.errors.email ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Пароль</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: loginForm.formState.errors.password ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full font-semibold"
                  style={{ background: '#10B981', color: 'white' }}
                >
                  {loginLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Входим...
                    </span>
                  ) : 'Войти'}
                </Button>
              </form>

              <Divider label="или" bg="hsl(240, 20%, 9%)" />

              <div className="space-y-2">
                <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
                <YandexButton onClick={handleYandexLogin} />
              </div>
            </CardContent>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register">
            <CardContent className="space-y-4 pt-2">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Имя</Label>
                  <Input
                    type="text"
                    placeholder="Ваше имя"
                    {...registerForm.register('display_name')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: registerForm.formState.errors.display_name ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {registerForm.formState.errors.display_name && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {registerForm.formState.errors.display_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...registerForm.register('email')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: registerForm.formState.errors.email ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Пароль</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('password')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: registerForm.formState.errors.password ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'hsl(255, 8%, 85%)' }}>Повторите пароль</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('confirm_password')}
                    style={{
                      background: 'hsl(240, 25%, 6%)',
                      borderColor: registerForm.formState.errors.confirm_password ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'hsl(255, 8%, 85%)',
                    }}
                  />
                  {registerForm.formState.errors.confirm_password && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>
                      {registerForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full font-semibold"
                  style={{ background: '#7C3AED', color: 'white' }}
                >
                  {registerLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Регистрируемся...
                    </span>
                  ) : 'Создать аккаунт'}
                </Button>
              </form>

              <Divider label="или войти через" bg="hsl(240, 20%, 9%)" />

              <div className="space-y-2">
                <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
                <YandexButton onClick={handleYandexLogin} />
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function Divider({ label, bg }: { label: string; bg: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-2" style={{ background: bg, color: 'hsl(255, 8%, 55%)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: 'white', color: '#3c4043', border: '1px solid #dadce0', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? <Spinner dark /> : <GoogleIcon />}
      Войти через Google
    </button>
  );
}

function YandexButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90"
      style={{ background: '#FC3F1D', color: 'white', border: 'none', cursor: 'pointer' }}
    >
      <YandexIcon />
      Войти через Яндекс
    </button>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={dark ? '#333' : 'white'} strokeWidth="4" />
      <path className="opacity-75" fill={dark ? '#333' : 'white'} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.4 21H12V13.44L8.16 21H5.64L9.96 12.6C8.04 11.88 6.72 10.08 6.72 7.92C6.72 5.04 8.88 3 12 3H14.4V21ZM12 5.04H12C10.32 5.04 9.12 6.24 9.12 7.92C9.12 9.6 10.32 10.8 12 10.8H12V5.04Z" />
    </svg>
  );
}
