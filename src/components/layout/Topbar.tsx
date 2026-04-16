import type { Board } from '@/types';
import { Maximize, Undo2, Redo2, Hash, Link2, Grid3X3 } from 'lucide-react';

interface TopbarProps {
  board: Board | null;
  cardCount: number;
  onToggleCmd: () => void;
}

export function Topbar({ board, cardCount, onToggleCmd }: TopbarProps) {
  if (!board) return null;

  return (
    <div className="h-[46px] flex items-center px-3.5 gap-[7px] shrink-0 z-15 relative" style={{ background: 'hsl(240, 25%, 6%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.06), rgba(16,185,129,0.04), transparent)' }} />

      <span className="font-display text-[13.5px] font-bold tracking-tight" style={{ color: 'hsl(260, 20%, 92%)' }}>
        {board.name}
      </span>
      <span className="text-[10px] ml-1" style={{ color: 'hsl(255,8%,40%)' }}>
        {board.description ? `${board.description} · ` : ''}{cardCount} карточек
      </span>

      <div className="flex-1" />

      <TopBtn title="Fit to screen"><Maximize className="w-3.5 h-3.5" /></TopBtn>
      <TopBtn title="Toggle connections"><Link2 className="w-3.5 h-3.5" /></TopBtn>
      <TopBtn title="Toggle grid"><Grid3X3 className="w-3.5 h-3.5" /></TopBtn>
      <div className="w-px h-[18px] mx-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <TopBtn title="Undo"><Undo2 className="w-3.5 h-3.5" /></TopBtn>
      <TopBtn title="Redo"><Redo2 className="w-3.5 h-3.5" /></TopBtn>
      <div className="w-px h-[18px] mx-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <TopBtn title="Command Palette" onClick={onToggleCmd}>
        <Hash className="w-3.5 h-3.5" />
      </TopBtn>
      <span className="text-[9px] font-mono px-[5px] py-[2px] rounded-[3px]" style={{ color: 'hsl(255,8%,40%)', background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)' }}>
        Ctrl+K
      </span>
    </div>
  );
}

function TopBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-[30px] h-[30px] flex items-center justify-center rounded-md cursor-pointer transition-all"
      style={{ border: '1px solid transparent', color: 'hsl(255,8%,62%)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(240, 17%, 12%)';
        e.currentTarget.style.color = 'hsl(260, 20%, 92%)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '';
        e.currentTarget.style.color = 'hsl(255,8%,62%)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
