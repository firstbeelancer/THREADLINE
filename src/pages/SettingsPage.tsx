import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import {
  ArrowLeft, User, Palette, Database, Shield,
  LogOut, Trash2, Moon, Sun, Monitor, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type ThemeMode = 'dark' | 'light' | 'system';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const store = useWorkspaceStore();
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
  };

  const handleExportAll = () => {
    const data = JSON.stringify({
      boards: store.boards,
      cards: store.cards,
      connections: store.connections,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threadline-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Резервная копия скачана');
  };

  const boardCount = store.boards.length;
  const cardCount = store.cards.length;
  const connectionCount = store.connections.length;

  const displayName = user?.display_name || 'User';
  const email = user?.email || 'user@threadline.io';
  const provider = user?.oauth_provider || 'email';
  const avatarLetter = displayName.charAt(0).toUpperCase();


  return (
    <div className="min-h-screen" style={{ background: 'hsl(240, 33%, 4%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top bar */}
      <div className="h-[46px] flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30" style={{ background: 'hsl(240, 25%, 6%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.06), rgba(16,185,129,0.04), transparent)' }} />
        <button
          onClick={() => navigate('/')}
          className="w-[30px] h-[30px] flex items-center justify-center rounded-md cursor-pointer transition-all"
          style={{ border: '1px solid transparent', color: 'hsl(255,8%,62%)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(240, 17%, 12%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="font-display text-[13.5px] font-bold tracking-tight" style={{ color: 'hsl(260, 20%, 92%)' }}>Настройки</span>
      </div>

      <div className="max-w-[560px] mx-auto px-4 py-6 pb-20">
        {/* Profile Card */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(255, 8%, 40%)' }}>
            <User className="w-3 h-3" />
            Профиль
          </div>
          <div
            className="rounded-[14px] p-4"
            style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={displayName} className="w-12 h-12 rounded-xl object-cover" style={{ boxShadow: '0 0 20px rgba(168,85,247,0.2)' }} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white" style={{ background: 'linear-gradient(135deg, #A855F7, #10B981)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                  {avatarLetter}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'hsl(260, 20%, 92%)' }}>{displayName}</div>
                <div className="text-[11px] truncate" style={{ color: 'hsl(255,8%,45%)' }}>{email}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9.5px] px-1.5 py-px rounded-[4px] font-medium" style={{ background: 'hsl(240, 20%, 12%)', color: 'hsl(255,8%,50%)' }}>
                    {provider === 'google' ? 'Google' : provider === 'yandex' ? 'Яндекс' : 'Email'}
                  </span>
                  <span className="text-[9.5px] px-1.5 py-px rounded-[4px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                    Активен
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBox value={boardCount} label="Бордов" />
              <StatBox value={cardCount} label="Карточек" />
              <StatBox value={connectionCount} label="Связей" />
            </div>
          </div>
        </section>


        {/* Appearance */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(255, 8%, 40%)' }}>
            <Palette className="w-3 h-3" />
            Внешний вид
          </div>
          <div className="rounded-[14px] p-4" style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[11.5px] font-medium mb-2.5" style={{ color: 'hsl(260, 20%, 85%)' }}>Тема</div>
            <div className="flex gap-2">
              <ThemeButton mode="dark" current={theme} onSelect={setTheme} icon={<Moon className="w-3.5 h-3.5" />} label="Тёмная" />
              <ThemeButton mode="light" current={theme} onSelect={setTheme} icon={<Sun className="w-3.5 h-3.5" />} label="Светлая" />
              <ThemeButton mode="system" current={theme} onSelect={setTheme} icon={<Monitor className="w-3.5 h-3.5" />} label="Система" />
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(255, 8%, 40%)' }}>
            <Database className="w-3 h-3" />
            Данные
          </div>
          <div className="rounded-[14px] overflow-hidden" style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <SettingRow icon={<Download className="w-3.5 h-3.5" />} title="Экспортировать всё" subtitle="Скачать JSON со всеми бордами, карточками и связями" onClick={handleExportAll} />
            <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <SettingRow icon={<Shield className="w-3.5 h-3.5" />} title="Все данные локальные" subtitle="Ничего не отправляется на внешние серверы" disabled />
          </div>
        </section>

        {/* Danger zone */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(0, 60%, 55%)' }}>
            <Shield className="w-3 h-3" />
            Опасная зона
          </div>
          <div className="rounded-[14px] overflow-hidden" style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <SettingRow icon={<LogOut className="w-3.5 h-3.5" />} title="Выйти из аккаунта" subtitle="Завершить текущую сессию" danger onClick={() => setShowLogoutConfirm(true)} />
            <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <SettingRow icon={<Trash2 className="w-3.5 h-3.5" />} title="Удалить аккаунт" subtitle="Навсегда удалить аккаунт и все данные" danger onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); }} />
          </div>
        </section>
      </div>


      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowLogoutConfirm(false)}>
          <div className="rounded-[16px] p-5 w-[340px] mx-4" style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-1" style={{ color: 'hsl(260, 20%, 92%)' }}>Выйти из аккаунта?</div>
            <div className="text-[11.5px] mb-4" style={{ color: 'hsl(255,8%,50%)' }}>Вы сможете войти снова в любой момент.</div>
            <div className="flex gap-2">
              <button onClick={handleLogout} className="flex-1 py-2 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}>Выйти</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 rounded-[8px] text-[12px] cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'hsl(255,8%,62%)', border: '1px solid rgba(255,255,255,0.08)' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="rounded-[16px] p-5 w-[380px] mx-4" style={{ background: 'hsl(240, 25%, 8%)', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
              <div className="text-sm font-semibold" style={{ color: '#EF4444' }}>Удалить аккаунт?</div>
            </div>
            <div className="text-[11.5px] mb-3 leading-relaxed" style={{ color: 'hsl(255,8%,50%)' }}>Это действие необратимо. Все ваши борды, карточки и связи будут безвозвратно удалены.</div>
            <div className="text-[10.5px] mb-2 font-medium" style={{ color: 'hsl(255,8%,40%)' }}>Введите <span className="font-mono" style={{ color: 'hsl(255,8%,60%)' }}>удалить</span> для подтверждения:</div>
            <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="удалить" className="w-full py-2 px-3 text-[12px] rounded-[8px] outline-none font-sans mb-4" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(239,68,68,0.2)', color: 'hsl(260, 20%, 92%)' }} autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { if (deleteConfirmText === 'удалить') { handleLogout(); toast.success('Аккаунт удален'); } }} disabled={deleteConfirmText !== 'удалить'} className="flex-1 py-2 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }} onMouseEnter={(e) => { if (deleteConfirmText === 'удалить') e.currentTarget.style.background = 'rgba(239,68,68,0.35)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}>Удалить навсегда</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-[8px] text-[12px] cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'hsl(255,8%,62%)', border: '1px solid rgba(255,255,255,0.08)' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* Subcomponents */

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[10px] p-2.5 text-center" style={{ background: 'hsl(240, 20%, 10%)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="text-lg font-bold font-display" style={{ color: 'hsl(260, 20%, 92%)' }}>{value}</div>
      <div className="text-[9.5px]" style={{ color: 'hsl(255,8%,40%)' }}>{label}</div>
    </div>
  );
}

function ThemeButton({ mode, current, onSelect, icon, label }: {
  mode: ThemeMode;
  current: ThemeMode;
  onSelect: (m: ThemeMode) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const active = mode === current;
  return (
    <button
      onClick={() => onSelect(mode)}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11.5px] cursor-pointer transition-all"
      style={{
        background: active ? 'rgba(168,85,247,0.12)' : 'transparent',
        color: active ? '#A855F7' : 'hsl(255,8%,50%)',
        border: active ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(255,255,255,0.05)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
    >
      {icon}
      {label}
    </button>
  );
}

function SettingRow({ icon, title, subtitle, danger, disabled, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-all text-left disabled:cursor-default"
      style={{ background: 'transparent', opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'hsl(240, 20%, 12%)' }}>
        <span style={{ color: danger ? '#EF4444' : 'hsl(255,8%,50%)' }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate" style={{ color: danger ? '#EF4444' : 'hsl(260, 20%, 85%)' }}>{title}</div>
        <div className="text-[10.5px] truncate" style={{ color: 'hsl(255,8%,42%)' }}>{subtitle}</div>
      </div>
      {!disabled && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'hsl(255,8%,30%)' }} />}
    </button>
  );
}

