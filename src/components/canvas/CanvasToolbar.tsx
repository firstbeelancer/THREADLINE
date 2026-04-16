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

const toolbarItems: CardType[] = [
  'prompt', 'text', 'image', 'video', 'html',
  'pptx', 'pdf', 'link', 'file', 'comment',
];

interface CanvasToolbarProps {
  onAddCard: (type: CardType) => void;
}

export function CanvasToolbar({ onAddCard }: CanvasToolbarProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-2 py-1.5 flex items-center gap-1">
      {toolbarItems.map((type) => {
        const config = CARD_TYPE_CONFIG[type];
        const Icon = iconMap[config.icon] || FileText;
        return (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAddCard(type)}
                className={`p-2 rounded-lg hover:bg-accent transition-colors card-type-text-${config.colorClass} hover:scale-110 active:scale-95`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {config.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
