import { Activity } from 'lucide-react';

interface WelcomeOverlayProps {
  onEnter: () => void;
}

export function WelcomeOverlay({ onEnter }: WelcomeOverlayProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(7,7,13,0.88)', backdropFilter: 'blur(20px)' }}>
      <div className="text-center max-w-[380px]">
        <div
          className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center mx-auto mb-[18px] animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #A855F7, #10B981)',
            boxShadow: '0 0 36px rgba(168,85,247,0.3), 0 0 70px rgba(16,185,129,0.12)',
          }}
        >
          <Activity className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-[26px] font-bold tracking-tight mb-1.5">
          THREAD<span className="bg-gradient-to-r from-[#A855F7] to-[#10B981] bg-clip-text text-transparent">LINE</span>
        </h1>
        <p className="text-[12.5px] leading-relaxed mb-5" style={{ color: 'hsl(255,8%,62%)' }}>
          Визуальная рабочая среда для идей, промтов, HTML-артефактов и всего, что между ними.
        </p>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-[7px] px-[22px] py-[9px] rounded-[9px] border-none text-[13px] font-semibold text-white cursor-pointer transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #A855F7, #10B981)',
            boxShadow: '0 0 28px rgba(168,85,247,0.3)',
          }}
        >
          Войти в Workspace
        </button>
        <div className="mt-3.5 text-[10.5px]" style={{ color: 'hsl(255,8%,40%)' }}>
          <kbd className="font-mono text-[9.5px] px-1 py-px rounded-sm" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>Ctrl+K</kbd> — команды ·{' '}
          <kbd className="font-mono text-[9.5px] px-1 py-px rounded-sm" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>P</kbd>{' '}
          <kbd className="font-mono text-[9.5px] px-1 py-px rounded-sm" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>T</kbd>{' '}
          <kbd className="font-mono text-[9.5px] px-1 py-px rounded-sm" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>H</kbd>{' '}
          <kbd className="font-mono text-[9.5px] px-1 py-px rounded-sm" style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>I</kbd> — карточки
        </div>
      </div>
    </div>
  );
}
