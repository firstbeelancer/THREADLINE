import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});
const registerSchema = z.object({
  display_name: z.string().min(2, 'Минимум 2 символа').max(50),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'Пароли не совпадают', path: ['confirm_password'] });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// ─── Neural Canvas Background ─────────────────────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#10B981', '#7C3AED', '#06B6D4', '#8B5CF6', '#34D399'];

    type NodeT = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; color: string;
      pulsePhase: number;
    };

    const N = Math.min(65, Math.floor((window.innerWidth * window.innerHeight) / 16000));
    const nodes: NodeT[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 2.2 + 1.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const MAX_DIST = 155;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += 0.017;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_DIST) continue;
          const alpha = (1 - dist / MAX_DIST) * 0.32;
          const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.color + hex(alpha));
          grad.addColorStop(1, b.color + hex(alpha));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      // nodes
      for (const n of nodes) {
        const pulse = 0.65 + 0.35 * Math.sin(n.pulsePhase);
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7);
        glow.addColorStop(0, n.color + 'bb');
        glow.addColorStop(0.35, n.color + '33');
        glow.addColorStop(1, n.color + '00');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 7 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.65 }} />
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function GlowInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: `1px solid ${error ? '#f87171' : focused ? '#10B981' : 'rgba(255,255,255,0.09)'}`,
          background: 'rgba(255,255,255,0.04)',
          color: 'hsl(255,8%,88%)',
          fontSize: 14,
          outline: 'none',
          backdropFilter: 'blur(6px)',
          boxSizing: 'border-box',
          transition: 'border-color .2s, box-shadow .2s',
          boxShadow: error
            ? '0 0 0 2px rgba(248,113,113,0.18)'
            : focused
            ? '0 0 0 2px rgba(16,185,129,0.2), 0 0 18px rgba(16,185,129,0.09)'
            : 'none',
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: 12, color: '#f87171', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'hsl(255,8%,60%)', marginBottom: 6 }}>{children}</label>;
}

function GlowButton({ children, onClick, disabled, variant = 'green', type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'green' | 'purple' | 'white' | 'red'; type?: 'button' | 'submit';
}) {
  const [hov, setHov] = useState(false);
  const bases: Record<string, React.CSSProperties> = {
    green: {
      background: hov ? 'linear-gradient(135deg,#0ea571,#059669)' : 'linear-gradient(135deg,#10B981,#059669)',
      color: 'white',
      boxShadow: hov ? '0 0 28px rgba(16,185,129,0.55), 0 4px 16px rgba(16,185,129,0.3)' : '0 0 14px rgba(16,185,129,0.28)',
    },
    purple: {
      background: hov ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
      color: 'white',
      boxShadow: hov ? '0 0 28px rgba(124,58,237,0.55), 0 4px 16px rgba(124,58,237,0.3)' : '0 0 14px rgba(124,58,237,0.28)',
    },
    white: {
      background: 'rgba(255,255,255,0.94)',
      color: '#1a1a2e',
      boxShadow: hov ? '0 0 20px rgba(255,255,255,0.12)' : 'none',
    },
    red: {
      background: hov ? '#e53a1c' : '#FC3F1D',
      color: 'white',
      boxShadow: hov ? '0 0 22px rgba(252,63,29,0.5)' : '0 0 10px rgba(252,63,29,0.22)',
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '11px 16px', borderRadius: 11, border: 'none',
        fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all .2s', ...bases[variant],
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 11, color: 'hsl(255,8%,38%)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>или</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg style={{ animation: 'tl-spin 1s linear infinite', width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <style>{`@keyframes tl-spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke={dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)'} strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={dark ? '#333' : 'white'} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
      <path d="M14.4 21H12V13.44L8.16 21H5.64L9.96 12.6C8.04 11.88 6.72 10.08 6.72 7.92C6.72 5.04 8.88 3 12 3H14.4V21ZM12 5.04C10.32 5.04 9.12 6.24 9.12 7.92C9.12 9.6 10.32 10.8 12 10.8V5.04Z"/>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, loginWithGoogle, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema), defaultValues: { display_name: '', email: '', password: '', confirm_password: '' } });

  useEffect(() => {
    const at = searchParams.get('access_token'), rt = searchParams.get('refresh_token'), err = searchParams.get('error');
    if (err) { toast.error('Ошибка авторизации через Яндекс'); return; }
    if (at && rt) { localStorage.setItem('access_token', at); localStorage.setItem('refresh_token', rt); window.location.replace('/'); }
  }, [searchParams]);

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (r) => {
          setGoogleLoading(true);
          try { await loginWithGoogle(r.credential); navigate('/', { replace: true }); }
          catch (e) { toast.error(e instanceof Error ? e.message : 'Ошибка Google'); }
          finally { setGoogleLoading(false); }
        },
      });
    };
    if (window.google) init();
    else document.querySelector('script[src*="gsi"]')?.addEventListener('load', init);
  }, [loginWithGoogle, navigate]);

  const onLogin = async (data: LoginData) => {
    setLoginLoading(true);
    try { await login(data.email, data.password); navigate('/', { replace: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Ошибка входа'); }
    finally { setLoginLoading(false); }
  };

  const onRegister = async (data: RegisterData) => {
    setRegisterLoading(true);
    try { await register(data.email, data.password, data.display_name); navigate('/', { replace: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Ошибка регистрации'); }
    finally { setRegisterLoading(false); }
  };

  const handleGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) { toast.error('Google OAuth не настроен'); return; }
    setGoogleLoading(true);
    window.google?.accounts.id.prompt();
    setTimeout(() => setGoogleLoading(false), 3000);
  }, []);

  const handleYandex = useCallback(() => { window.location.href = API_URL + '/auth/yandex'; }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif', position: 'relative' }}>
      <NeuralCanvas />

      {/* ambient glows */}
      <div style={{ position: 'fixed', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.065) 0%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.055) 0%, transparent 65%)', top: '38%', left: '58%', transform: 'translate(-50%,-50%)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 10, marginBottom: 28, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg,#10B981 0%,#7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(16,185,129,0.45), 0 0 60px rgba(124,58,237,0.18)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="5" r="1.8" fill="white" opacity="0.95"/>
              <circle cx="19" cy="5" r="1.8" fill="white" opacity="0.95"/>
              <circle cx="12" cy="12" r="2.4" fill="white"/>
              <circle cx="5" cy="19" r="1.8" fill="white" opacity="0.95"/>
              <circle cx="19" cy="19" r="1.8" fill="white" opacity="0.95"/>
              <line x1="5" y1="5" x2="12" y2="12" stroke="white" strokeWidth="1.1" opacity="0.55"/>
              <line x1="19" y1="5" x2="12" y2="12" stroke="white" strokeWidth="1.1" opacity="0.55"/>
              <line x1="5" y1="19" x2="12" y2="12" stroke="white" strokeWidth="1.1" opacity="0.55"/>
              <line x1="19" y1="19" x2="12" y2="12" stroke="white" strokeWidth="1.1" opacity="0.55"/>
              <line x1="5" y1="5" x2="19" y2="5" stroke="white" strokeWidth="0.9" opacity="0.22"/>
              <line x1="5" y1="19" x2="19" y2="19" stroke="white" strokeWidth="0.9" opacity="0.22"/>
            </svg>
          </div>
          <span style={{
            fontSize: 27, fontWeight: 800, letterSpacing: '0.18em',
            background: 'linear-gradient(120deg,#e2e8f0 25%,#10B981 65%,#8B5CF6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            THREADLINE
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'hsl(255,8%,45%)', letterSpacing: '0.04em' }}>
          Визуальная карта твоих идей
        </p>
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 420,
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,9,24,0.78)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 0 0 1px rgba(16,185,129,0.07), 0 32px 80px rgba(0,0,0,0.75), 0 0 100px rgba(16,185,129,0.05)',
        padding: '28px 28px 24px',
      }}>
        {/* tab switcher */}
        <div style={{ display: 'flex', marginBottom: 22, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: 3 }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              background: tab === t ? 'linear-gradient(135deg,rgba(16,185,129,0.16),rgba(124,58,237,0.16))' : 'transparent',
              color: tab === t ? '#e2e8f0' : 'hsl(255,8%,42%)',
              boxShadow: tab === t ? '0 0 14px rgba(16,185,129,0.1)' : 'none',
            }}>
              {t === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          ))}
        </div>

        {tab === 'login' && (
          <form onSubmit={loginForm.handleSubmit(onLogin)} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div><FieldLabel>Email</FieldLabel><GlowInput type="email" placeholder="you@example.com" error={loginForm.formState.errors.email?.message} {...loginForm.register('email')} /></div>
            <div><FieldLabel>Пароль</FieldLabel><GlowInput type="password" placeholder="••••••••" error={loginForm.formState.errors.password?.message} {...loginForm.register('password')} /></div>
            <GlowButton type="submit" variant="green" disabled={loginLoading}>{loginLoading ? <><Spinner />Входим…</> : 'Войти'}</GlowButton>
            <Divider />
            <GlowButton variant="white" onClick={handleGoogle} disabled={googleLoading}>{googleLoading ? <Spinner dark /> : <GoogleIcon />}Войти через Google</GlowButton>
            <GlowButton variant="red" onClick={handleYandex}><YandexIcon />Войти через Яндекс</GlowButton>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={registerForm.handleSubmit(onRegister)} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><FieldLabel>Имя</FieldLabel><GlowInput type="text" placeholder="Ваше имя" error={registerForm.formState.errors.display_name?.message} {...registerForm.register('display_name')} /></div>
            <div><FieldLabel>Email</FieldLabel><GlowInput type="email" placeholder="you@example.com" error={registerForm.formState.errors.email?.message} {...registerForm.register('email')} /></div>
            <div><FieldLabel>Пароль</FieldLabel><GlowInput type="password" placeholder="••••••••" error={registerForm.formState.errors.password?.message} {...registerForm.register('password')} /></div>
            <div><FieldLabel>Повторите пароль</FieldLabel><GlowInput type="password" placeholder="••••••••" error={registerForm.formState.errors.confirm_password?.message} {...registerForm.register('confirm_password')} /></div>
            <GlowButton type="submit" variant="purple" disabled={registerLoading}>{registerLoading ? <><Spinner />Создаём…</> : 'Создать аккаунт'}</GlowButton>
            <Divider />
            <GlowButton variant="white" onClick={handleGoogle} disabled={googleLoading}>{googleLoading ? <Spinner dark /> : <GoogleIcon />}Войти через Google</GlowButton>
            <GlowButton variant="red" onClick={handleYandex}><YandexIcon />Войти через Яндекс</GlowButton>
          </form>
        )}
      </div>

      <p style={{ position: 'relative', zIndex: 10, marginTop: 18, fontSize: 12, color: 'hsl(255,8%,28%)' }}>
        Ваши данные хранятся только на вашем сервере
      </p>
    </div>
  );
}
