import type { CardType } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
};

const GLOW_COLORS: Record<string, string> = {
  prompt: '#A855F7', text: '#3B82F6', image: '#06B6D4', video: '#EF4444',
  html: '#10B981', pptx: '#F97316', pdf: '#9CA3AF', link: '#0EA5E9',
  file: '#6B7280', group: '#4B5563', comment: '#EAB308',
};

const toolbarGroups: CardType[][] = [
  ['prompt', 'text', 'image', 'html'],
  ['video', 'link', 'pdf', 'pptx', 'file'],
  ['comment'],
];

interface CanvasToolbarProps {
  onAddCard: (type: CardType) => void;
}

export function CanvasToolbar({ onAddCard }: CanvasToolbarProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl px-2 py-1.5 flex items-center gap-0.5">
      {toolbarGroups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-7 bg-border mx-1" />}
          {group.map((type) => {
            const config = CARD_TYPE_CONFIG[type];
            const Icon = iconMap[config.icon] || FileText;
            const color = GLOW_COLORS[config.colorClass];
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onAddCard(type)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-transparent transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent"
                    style={{
                      ['--glow-color' as string]: color,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${color}60`;
                      e.currentTarget.style.boxShadow = `0 0 12px ${color}25`;
                      e.currentTarget.style.color = color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
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
