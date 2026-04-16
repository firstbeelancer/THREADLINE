import type { CardType } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare, CheckSquare,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare, CheckSquare,
};

const GLOW: Record<string, { color: string; soft: string; ring: string }> = {
  prompt: { color: '#A855F7', soft: 'rgba(168,85,247,0.12)', ring: 'rgba(168,85,247,0.35)' },
  text:   { color: '#3B82F6', soft: 'rgba(59,130,246,0.12)', ring: 'rgba(59,130,246,0.35)' },
  image:  { color: '#06B6D4', soft: 'rgba(6,182,212,0.12)', ring: 'rgba(6,182,212,0.35)' },
  video:  { color: '#EF4444', soft: 'rgba(239,68,68,0.12)', ring: 'rgba(239,68,68,0.35)' },
  html:   { color: '#10B981', soft: 'rgba(16,185,129,0.12)', ring: 'rgba(16,185,129,0.35)' },
  pptx:   { color: '#F97316', soft: 'rgba(249,115,22,0.12)', ring: 'rgba(249,115,22,0.35)' },
  pdf:    { color: '#9CA3AF', soft: 'rgba(156,163,175,0.10)', ring: 'rgba(156,163,175,0.30)' },
  link:   { color: '#0EA5E9', soft: 'rgba(14,165,233,0.12)', ring: 'rgba(14,165,233,0.35)' },
  file:   { color: '#6B7280', soft: 'rgba(107,114,128,0.10)', ring: 'rgba(107,114,128,0.30)' },
  group:  { color: '#4B5563', soft: 'rgba(75,85,99,0.08)', ring: 'rgba(75,85,99,0.25)' },
  comment: { color: '#EAB308', soft: 'rgba(234,179,8,0.12)', ring: 'rgba(234,179,8,0.35)' },
  todo:    { color: '#22C55E', soft: 'rgba(34,197,94,0.12)', ring: 'rgba(34,197,94,0.35)' },
};

const toolbarGroups: CardType[][] = [
  ['prompt', 'text', 'image', 'html'],
  ['video', 'link', 'pdf', 'pptx', 'file'],
  ['todo', 'comment'],
];

interface CanvasToolbarProps {
  onAddCard: (type: CardType) => void;
}

export function CanvasToolbar({ onAddCard }: CanvasToolbarProps) {
  return (
    <div className="flex gap-[2px] p-[5px] rounded-[11px]" style={{ background: 'hsl(240, 25%, 6%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 36px rgba(0,0,0,0.5)' }}>
      {toolbarGroups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-[2px]">
          {gi > 0 && <div className="w-px h-[22px] mx-[2px]" style={{ background: 'rgba(255,255,255,0.05)' }} />}
          {group.map((type) => {
            const config = CARD_TYPE_CONFIG[type];
            const Icon = iconMap[config.icon] || FileText;
            const glow = GLOW[config.colorClass];
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAddCard(type)}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-[7px] cursor-pointer transition-all"
                    style={{
                      border: '1px solid transparent',
                      background: 'transparent',
                      color: 'hsl(255,8%,62%)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(240, 17%, 12%)';
                      e.currentTarget.style.color = glow.color;
                      e.currentTarget.style.borderColor = glow.ring;
                      e.currentTarget.style.boxShadow = `0 0 12px ${glow.soft}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'hsl(255,8%,62%)';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Icon className="w-[15px] h-[15px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[9.5px]">
                  {config.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
