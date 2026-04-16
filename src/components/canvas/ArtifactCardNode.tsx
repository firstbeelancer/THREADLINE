import { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from '@xyflow/react';
import type { Card } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
  MoreHorizontal, Copy, Trash2,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
};

const GLOW_COLORS: Record<string, { color: string; soft: string; ring: string }> = {
  prompt:  { color: '#A855F7', soft: 'rgba(168,85,247,0.15)', ring: 'rgba(168,85,247,0.40)' },
  text:    { color: '#3B82F6', soft: 'rgba(59,130,246,0.15)', ring: 'rgba(59,130,246,0.40)' },
  image:   { color: '#06B6D4', soft: 'rgba(6,182,212,0.15)', ring: 'rgba(6,182,212,0.40)' },
  video:   { color: '#EF4444', soft: 'rgba(239,68,68,0.15)', ring: 'rgba(239,68,68,0.40)' },
  html:    { color: '#10B981', soft: 'rgba(16,185,129,0.15)', ring: 'rgba(16,185,129,0.40)' },
  pptx:    { color: '#F97316', soft: 'rgba(249,115,22,0.15)', ring: 'rgba(249,115,22,0.40)' },
  pdf:     { color: '#9CA3AF', soft: 'rgba(156,163,175,0.15)', ring: 'rgba(156,163,175,0.40)' },
  link:    { color: '#0EA5E9', soft: 'rgba(14,165,233,0.15)', ring: 'rgba(14,165,233,0.40)' },
  file:    { color: '#6B7280', soft: 'rgba(107,114,128,0.12)', ring: 'rgba(107,114,128,0.30)' },
  group:   { color: '#4B5563', soft: 'rgba(75,85,99,0.10)', ring: 'rgba(75,85,99,0.25)' },
  comment: { color: '#EAB308', soft: 'rgba(234,179,8,0.15)', ring: 'rgba(234,179,8,0.40)' },
};

export const ArtifactCardNode = memo(({ data, id, selected }: NodeProps) => {
  const card = (data as any).card as Card;
  const config = CARD_TYPE_CONFIG[card.type];
  const Icon = iconMap[config.icon] || FileText;
  const glow = GLOW_COLORS[config.colorClass] || GLOW_COLORS.text;
  const store = useWorkspaceStore;
  const { setNodes } = useReactFlow();

  const onResizeEnd = useCallback((_: any, params: { width: number; height: number }) => {
    store.getState().updateCard(id, { width: params.width, height: params.height });
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, style: { ...n.style, width: params.width, height: params.height } }
          : n
      )
    );
  }, [id, store, setNodes]);

  return (
    <div
      className="rounded-xl overflow-hidden h-full flex flex-col group transition-all duration-200"
      style={{
        border: `1px solid ${selected ? glow.ring : 'rgba(255,255,255,0.06)'}`,
        backgroundColor: 'hsl(240, 18%, 10%)',
        boxShadow: selected
          ? `0 0 0 1px ${glow.ring}, 0 0 20px ${glow.soft}`
          : `0 2px 8px rgba(0,0,0,0.3)`,
      }}
    >
      <NodeResizer
        minWidth={140}
        minHeight={80}
        lineClassName="!border-primary/40"
        handleClassName="!w-2.5 !h-2.5 !bg-primary !border-0 !rounded-sm"
        onResizeEnd={onResizeEnd}
      />
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Label bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 border-b"
        style={{
          backgroundColor: glow.soft,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: glow.color }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: glow.color }}
        >
          {config.label}
        </span>
        {card.tags.length > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {card.tags[0]}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          className="w-6 h-6 flex items-center justify-center rounded-md bg-card/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Дублировать"
          onClick={(e) => { e.stopPropagation(); store.getState().duplicateCard(id); }}
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 flex items-center justify-center rounded-md bg-card/90 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Удалить"
          onClick={(e) => { e.stopPropagation(); store.getState().deleteCard(id); }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
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
          <div className="mt-2 text-[10px] truncate" style={{ color: glow.color }}>
            {card.content.url}
          </div>
        )}
        {card.type === 'html' && card.content?.body && (
          <div className="mt-2 p-2 rounded bg-secondary/50 text-[10px] font-mono line-clamp-4" style={{ color: glow.color }}>
            {card.content.body}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] text-muted-foreground">
          {new Date(card.createdAt).toLocaleDateString('ru-RU')}
        </span>
        {card.tags.length > 1 && (
          <div className="flex gap-1">
            {card.tags.slice(1, 3).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
        {card.isLocked && (
          <span className="text-[10px] text-muted-foreground">🔒</span>
        )}
      </div>
    </div>
  );
});

ArtifactCardNode.displayName = 'ArtifactCardNode';
