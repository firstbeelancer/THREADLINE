import { Activity } from 'lucide-react';

interface StatusBarProps {
  cardCount: number;
  connectionCount: number;
}

export function StatusBar({ cardCount, connectionCount }: StatusBarProps) {
  return (
    <div className="h-[22px] flex items-center px-2.5 gap-2.5 z-10 font-mono text-[9.5px]" style={{ background: 'hsl(240, 25%, 6%)', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'hsl(255,8%,40%)' }}>
      <div className="w-[5px] h-[5px] rounded-full" style={{ background: '#10B981', boxShadow: '0 0 5px rgba(16,185,129,0.4)' }} />
      <div className="flex items-center gap-[3px]">
        <Activity className="w-[9px] h-[9px]" />
        Connected
      </div>
      <div>{cardCount} cards</div>
      <div>{connectionCount} connections</div>
      <div className="flex-1" />
    </div>
  );
}
