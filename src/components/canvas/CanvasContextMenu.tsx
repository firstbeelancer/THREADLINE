import { CARD_TYPE_CONFIG, type CardType } from '@/types';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare, CheckSquare, Mic,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare, CheckSquare, Mic,
};

const menuItems: CardType[] = [
  'prompt', 'text', 'image', 'html', 'video', 'voice',
  'link', 'pdf', 'pptx', 'file', 'todo', 'comment',
];

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onAddCard: (type: CardType, x: number, y: number) => void;
  onClose: () => void;
}

export function CanvasContextMenu({ x, y, onAddCard, onClose }: CanvasContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-card border border-border rounded-xl shadow-2xl p-1.5 min-w-[180px] animate-fade-in"
        style={{ left: x, top: y }}
      >
        <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Добавить карточку
        </div>
        {menuItems.map((type) => {
          const config = CARD_TYPE_CONFIG[type];
          const Icon = iconMap[config.icon] || FileText;
          return (
            <button
              key={type}
              onClick={() => { onAddCard(type, x, y); onClose(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
