import { memo, useCallback, useMemo, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from '@xyflow/react';
import type { Card } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
  Copy, Trash2, MoreHorizontal, CheckSquare, Square, CheckSquare2, Smile, Mic,
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '⭐', '🔥', '✅', '❌', '⚡', '💡', '🎯', '👀', '🏆', '💎'];

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare, CheckSquare, Mic,
};

const GLOW: Record<string, { color: string; soft: string; ring: string }> = {
  prompt:  { color: '#A855F7', soft: 'rgba(168,85,247,0.12)', ring: 'rgba(168,85,247,0.35)' },
  text:    { color: '#3B82F6', soft: 'rgba(59,130,246,0.12)', ring: 'rgba(59,130,246,0.35)' },
  image:   { color: '#06B6D4', soft: 'rgba(6,182,212,0.12)', ring: 'rgba(6,182,212,0.35)' },
  video:   { color: '#EF4444', soft: 'rgba(239,68,68,0.12)', ring: 'rgba(239,68,68,0.35)' },
  html:    { color: '#10B981', soft: 'rgba(16,185,129,0.12)', ring: 'rgba(16,185,129,0.35)' },
  pptx:    { color: '#F97316', soft: 'rgba(249,115,22,0.12)', ring: 'rgba(249,115,22,0.35)' },
  pdf:     { color: '#9CA3AF', soft: 'rgba(156,163,175,0.10)', ring: 'rgba(156,163,175,0.30)' },
  link:    { color: '#0EA5E9', soft: 'rgba(14,165,233,0.12)', ring: 'rgba(14,165,233,0.35)' },
  file:    { color: '#6B7280', soft: 'rgba(107,114,128,0.10)', ring: 'rgba(107,114,128,0.30)' },
  group:   { color: '#4B5563', soft: 'rgba(75,85,99,0.08)', ring: 'rgba(75,85,99,0.25)' },
  comment: { color: '#EAB308', soft: 'rgba(234,179,8,0.12)', ring: 'rgba(234,179,8,0.35)' },
  todo:    { color: '#22C55E', soft: 'rgba(34,197,94,0.12)', ring: 'rgba(34,197,94,0.35)' },
  voice:   { color: '#EC4899', soft: 'rgba(236,72,153,0.12)', ring: 'rgba(236,72,153,0.35)' },
};

/** PPTX slide preview — adapts layout based on card aspect ratio */
function PptxPreview({ card, glow }: { card: Card; glow: { color: string; soft: string; ring: string } }) {
  const slides: string[] = card.content?.slides || [];
  const hasSlides = slides.length > 0;

  if (!hasSlides) {
    return (
      <div className="mt-1 h-[85px] rounded-[7px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
        <Presentation className="w-[26px] h-[26px] opacity-35 relative z-[1]" style={{ color: glow.color }} />
      </div>
    );
  }

  const isWide = card.width > card.height * 1.2;

  return (
    <div
      className={`mt-1.5 flex-1 min-h-0 flex gap-1.5 overflow-auto rounded-[7px] p-1.5 ${isWide ? 'flex-row' : 'flex-col'}`}
      style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {slides.map((slideHtml, i) => (
        <div
          key={i}
          className="rounded-[5px] overflow-hidden shrink-0 relative"
          style={{
            width: isWide ? 'auto' : '100%',
            height: isWide ? '100%' : 'auto',
            aspectRatio: '16/9',
            flex: '0 0 auto',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <iframe
            srcDoc={slideHtml}
            sandbox="allow-scripts"
            className="w-full h-full border-0 pointer-events-none"
            style={{ background: '#fff', minWidth: isWide ? 120 : undefined, minHeight: isWide ? undefined : 60 }}
            title={`Slide ${i + 1}`}
          />
          <div className="absolute bottom-1 right-1 text-[8px] font-mono px-1 py-px rounded" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.5)' }}>
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

export const ArtifactCardNode = memo(({ data, id, selected }: NodeProps) => {
  const card = (data as any).card as Card;
  const config = CARD_TYPE_CONFIG[card.type];
  const Icon = iconMap[config.icon] || FileText;
  const glow = GLOW[config.colorClass] || GLOW.text;
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

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'сейчас';
    if (mins < 60) return `${mins}м`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}ч`;
    return `${Math.floor(hrs / 24)}д`;
  };

  return (
    <div
      className="rounded-[11px] overflow-visible h-full flex flex-col group transition-all duration-200"
      style={{
        background: 'hsl(240, 20%, 9%)',
        border: `1px solid ${selected ? glow.ring : 'rgba(255,255,255,0.05)'}`,
        boxShadow: selected
          ? `0 0 0 1px ${glow.ring}, 0 0 22px ${glow.soft}`
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <NodeResizer
        minWidth={140}
        minHeight={80}
        lineClassName="!border-transparent"
        handleClassName="!w-2.5 !h-2.5 !bg-white/20 !border-0 !rounded-sm"
        onResizeEnd={onResizeEnd}
      />

      <Handle type="target" position={Position.Top} className="!bg-white/20 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!bg-white/20 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!bg-white/20 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Label bar */}
      <div
        className="flex items-center gap-[5px] px-[11px] py-1.5 text-[9.5px] font-semibold uppercase tracking-wide"
        style={{
          background: glow.soft,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: glow.color,
        }}
      >
        <Icon className="w-3 h-3" style={{ color: glow.color }} />
        {config.label}
        {card.content?.emoji && (
          <span className="ml-auto text-[14px] leading-none not-italic normal-case">{card.content.emoji}</span>
        )}
      </div>

      {/* Hover actions — above card */}
      <EmojiAndActions id={id} card={card} glow={glow} store={store} />

      {/* Content */}
      <div className="flex-1 px-[11px] py-[10px] flex flex-col gap-1 min-h-0">
        <div className="text-[13px] font-semibold leading-tight line-clamp-2" style={{ color: 'hsl(260, 20%, 92%)' }}>
          {card.title || 'Без названия'}
        </div>
        {card.description && (
          <div className="text-[11px] leading-relaxed line-clamp-3" style={{ color: 'hsl(255,8%,62%)' }}>
            {card.description}
          </div>
        )}

        {/* Type-specific previews */}
        {card.type === 'prompt' && card.content?.body && (
          <div className="mt-1.5 p-[9px] rounded-[7px] text-[10px] font-mono line-clamp-4" style={{ background: 'hsl(240, 33%, 4%)', color: 'hsl(255,8%,62%)' }}>
            {card.content.body}
          </div>
        )}
        {card.type === 'image' && card.content?.imageUrl && (
          <div className="mt-1 flex-1 min-h-0 rounded-[7px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
            <img src={card.content.imageUrl} alt={card.title || ''} className="w-full h-full object-cover" />
          </div>
        )}
        {card.type === 'image' && !card.content?.imageUrl && (
          <div className="mt-1 h-[85px] rounded-[7px] flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
            <Image className="w-[26px] h-[26px] opacity-35 relative z-[1]" style={{ color: glow.color }} />
          </div>
        )}
        {card.type === 'video' && (
          <div className="mt-1 h-[85px] rounded-[7px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
            <Play className="w-[26px] h-[26px] relative z-[1]" style={{ color: glow.color }} />
          </div>
        )}
        {card.type === 'html' && card.content?.body && (
          <div className="mt-1.5 rounded-[7px] overflow-hidden relative flex-1 min-h-[80px]" style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <iframe
              srcDoc={card.content.body}
              sandbox="allow-scripts"
              className="w-full h-full border-0 pointer-events-none"
              style={{ minHeight: 80, background: '#fff' }}
              title={card.title || 'HTML Preview'}
            />
          </div>
        )}
        {card.type === 'link' && card.content?.url && (
          <a
            href={card.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 rounded-[7px] block cursor-pointer no-underline transition-all hover:brightness-110"
            style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {card.content.ogImage && (
              <div className="w-full aspect-video rounded-t-[7px] overflow-hidden">
                <img src={card.content.ogImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-[9px] flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(card.content.url).hostname}&sz=32`}
                  alt=""
                  className="w-[14px] h-[14px] rounded-[2px] shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-[10px] font-medium truncate" style={{ color: 'hsl(255,8%,62%)' }}>
                  {card.content.ogTitle || new URL(card.content.url).hostname}
                </span>
              </div>
              {card.content.ogDescription && (
                <span className="text-[9px] line-clamp-2 leading-relaxed" style={{ color: 'hsl(255,8%,40%)' }}>
                  {card.content.ogDescription}
                </span>
              )}
              <span className="text-[8.5px] font-mono truncate mt-0.5" style={{ color: glow.color, opacity: 0.7 }}>
                {card.content.url}
              </span>
            </div>
          </a>
        )}
        {card.type === 'link' && !card.content?.url && (
          <div className="mt-1 h-[85px] rounded-[7px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
            <Link2 className="w-[26px] h-[26px] opacity-35 relative z-[1]" style={{ color: glow.color }} />
          </div>
        )}
        {card.type === 'pdf' && (
          <div className="mt-1.5 h-[60px] rounded-[7px] flex items-center gap-[9px] px-3" style={{ background: 'hsl(240, 33%, 4%)' }}>
            <FileType className="w-[22px] h-[22px] opacity-45 shrink-0" style={{ color: glow.color }} />
            <div className="flex flex-col gap-px">
              <span className="text-[10.5px] font-medium" style={{ color: 'hsl(255,8%,62%)' }}>
                {card.content?.fileName || 'document.pdf'}
              </span>
              <span className="text-[9.5px] font-mono" style={{ color: 'hsl(255,8%,40%)' }}>
                {card.content?.fileSize || '—'}
              </span>
            </div>
          </div>
        )}
        {card.type === 'pptx' && <PptxPreview card={card} glow={glow} />}
        {card.type === 'voice' && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            {card.content?.audioUrl ? (
              <audio
                src={card.content.audioUrl}
                controls
                className="w-full h-[30px]"
                style={{ filter: 'invert(0.85) hue-rotate(180deg)' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="h-[40px] rounded-[7px] flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${glow.soft}, hsl(240, 33%, 4%))` }}>
                <Mic className="w-[18px] h-[18px] opacity-50" style={{ color: glow.color }} />
                <span className="text-[10px]" style={{ color: 'hsl(255,8%,50%)' }}>Запишите или загрузите</span>
              </div>
            )}
            {card.content?.transcript && (
              <div
                className="p-[8px] rounded-[6px] text-[10.5px] leading-relaxed line-clamp-4 italic"
                style={{ background: 'hsl(240, 33%, 4%)', color: 'hsl(255,8%,72%)', borderLeft: `2px solid ${glow.color}` }}
              >
                «{card.content.transcript}»
              </div>
            )}
            {card.content?.audioUrl && !card.content?.transcript && (
              <div className="text-[9.5px] italic" style={{ color: 'hsl(255,8%,40%)' }}>
                Транскрипт ещё не сделан — откройте карточку
              </div>
            )}
          </div>
        )}
        {card.type === 'todo' && (
          <div className="mt-1 flex flex-col gap-[3px]">
            {((card.content?.items as Array<{ text: string; done: boolean }>) || []).map((item, i) => (
              <div key={i} className="flex items-center gap-[6px] px-1">
                {item.done ? (
                  <CheckSquare2 className="w-[12px] h-[12px] shrink-0" style={{ color: '#22C55E' }} />
                ) : (
                  <Square className="w-[12px] h-[12px] shrink-0" style={{ color: 'hsl(255,8%,40%)' }} />
                )}
                <span className={`text-[11px] leading-tight ${item.done ? 'line-through' : ''}`} style={{ color: item.done ? 'hsl(255,8%,40%)' : 'hsl(255,8%,62%)' }}>
                  {item.text}
                </span>
              </div>
            ))}
            {((card.content?.items as Array<{ text: string; done: boolean }>) || []).length === 0 && (
              <div className="text-[10px] italic" style={{ color: 'hsl(255,8%,40%)' }}>Нет задач</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 px-[11px] py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'hsl(255,8%,40%)' }}>
        {card.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-[9px] px-[5px] py-px rounded-[3px] font-medium" style={{ background: 'hsl(240, 17%, 12%)', border: '1px solid rgba(255,255,255,0.05)', color: 'hsl(255,8%,62%)' }}>
            {tag}
          </span>
        ))}
        <span className="ml-auto text-[9px] font-mono opacity-60">
          {getTimeAgo(card.createdAt)}
        </span>
      </div>
    </div>
  );
});

function EmojiAndActions({ id, card, glow, store }: { id: string; card: Card; glow: { color: string; soft: string; ring: string }; store: typeof useWorkspaceStore }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="absolute -top-[9px] right-[7px] flex gap-[2px] opacity-0 group-hover:opacity-100 translate-y-[3px] group-hover:translate-y-0 transition-all z-10">
        <ActionBtn
          title="Эмодзи"
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          glow={glow}
        >
          <Smile className="w-[10px] h-[10px]" />
        </ActionBtn>
        <ActionBtn
          title="Дубликат"
          onClick={(e) => { e.stopPropagation(); store.getState().duplicateCard(id); }}
          glow={glow}
        >
          <Copy className="w-[10px] h-[10px]" />
        </ActionBtn>
        <ActionBtn
          title="Удалить"
          onClick={(e) => { e.stopPropagation(); store.getState().deleteCard(id); }}
          glow={glow}
          danger
        >
          <Trash2 className="w-[10px] h-[10px]" />
        </ActionBtn>
      </div>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setShowPicker(false); }} />
          <div
            className="absolute -top-[52px] right-0 z-30 flex gap-[3px] p-[5px] rounded-[8px] animate-fade-in"
            style={{ background: 'hsl(240, 25%, 6%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {card.content?.emoji && (
              <button
                className="w-[24px] h-[24px] flex items-center justify-center rounded-[5px] text-[10px] cursor-pointer transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                onClick={() => { store.getState().updateCard(id, { content: { ...card.content, emoji: undefined } }); setShowPicker(false); }}
                title="Убрать"
              >✕</button>
            )}
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-[5px] text-[14px] cursor-pointer transition-all hover:scale-125 hover:bg-white/10"
                onClick={() => { store.getState().updateCard(id, { content: { ...card.content, emoji: em } }); setShowPicker(false); }}
              >
                {em}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ActionBtn({ children, title, onClick, glow, danger }: {
  children: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  glow: { color: string; soft: string; ring: string };
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-[22px] h-[22px] flex items-center justify-center rounded-[5px] cursor-pointer transition-all"
      style={{
        background: 'hsl(240, 17%, 12%)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'hsl(255,8%,62%)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(240, 20%, 16%)';
        e.currentTarget.style.color = danger ? '#EF4444' : 'hsl(260, 20%, 92%)';
        e.currentTarget.style.borderColor = danger ? 'rgba(239,68,68,0.35)' : glow.ring;
        e.currentTarget.style.boxShadow = `0 0 8px ${danger ? 'rgba(239,68,68,0.2)' : glow.soft}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(240, 17%, 12%)';
        e.currentTarget.style.color = 'hsl(255,8%,62%)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      }}
    >
      {children}
    </button>
  );
}

ArtifactCardNode.displayName = 'ArtifactCardNode';
