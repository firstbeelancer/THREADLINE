import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Card } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
};

export const ArtifactCardNode = memo(({ data }: NodeProps) => {
  const card = (data as any).card as Card;
  const config = CARD_TYPE_CONFIG[card.type];
  const Icon = iconMap[config.icon] || FileText;

  return (
    <div
      className={`bg-card rounded-lg border-2 card-type-border-${config.colorClass} shadow-lg overflow-hidden h-full flex flex-col group hover:shadow-xl transition-shadow`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Type badge */}
      <div className="px-3 pt-3 pb-1 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded card-type-bg-${config.colorClass} card-type-text-${config.colorClass}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        {card.tags.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {card.tags[0]}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 px-3 py-2 min-h-0">
        <h4 className="text-xs font-semibold truncate mb-1">
          {card.title || 'Без названия'}
        </h4>
        {card.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Type-specific preview */}
        {card.type === 'prompt' && card.content?.body && (
          <div className="mt-2 p-2 rounded bg-secondary/50 text-[10px] font-mono text-muted-foreground line-clamp-4">
            {card.content.body}
          </div>
        )}
        {card.type === 'image' && card.content?.imageUrl && (
          <div className="mt-1 flex-1 min-h-0">
            <img src={card.content.imageUrl} alt={card.title || ''} className="w-full h-full object-cover rounded" />
          </div>
        )}
        {card.type === 'link' && card.content?.url && (
          <div className="mt-2 text-[10px] text-primary truncate">
            {card.content.url}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {new Date(card.createdAt).toLocaleDateString('ru-RU')}
        </span>
        {card.isLocked && (
          <span className="text-[10px] text-muted-foreground">🔒</span>
        )}
      </div>
    </div>
  );
});

ArtifactCardNode.displayName = 'ArtifactCardNode';
