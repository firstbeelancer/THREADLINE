import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { CARD_TYPE_CONFIG, type CardType } from '@/types';
import {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
  Search, Plus, LayoutGrid, Maximize, Undo2, Redo2,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, FileText, Image, Play, Code2, Presentation,
  FileType, Link2, Paperclip, Layers, MessageSquare,
};

interface Command {
  id: string;
  label: string;
  group: string;
  icon: React.ElementType;
  color?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAddCard?: (type: CardType) => void;
  boardId?: string;
}

export function CommandPalette({ open, onClose, onAddCard, boardId }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const store = useWorkspaceStore();

  const commands: Command[] = [];

  // Create card commands
  if (onAddCard) {
    const cardTypes: CardType[] = ['prompt', 'text', 'image', 'html', 'video', 'link', 'pdf', 'pptx', 'file', 'comment'];
    const shortcuts: Record<string, string> = { prompt: 'P', text: 'T', image: 'I', html: 'H' };
    cardTypes.forEach((type) => {
      const config = CARD_TYPE_CONFIG[type];
      const Icon = iconMap[config.icon] || FileText;
      commands.push({
        id: `create-${type}`,
        label: `Создать ${config.label}`,
        group: 'Создать',
        icon: Icon,
        shortcut: shortcuts[type],
        action: () => { onAddCard(type); onClose(); },
      });
    });
  }

  // Navigate to boards
  store.boards.forEach((board) => {
    commands.push({
      id: `nav-${board.id}`,
      label: board.name,
      group: 'Борды',
      icon: LayoutGrid,
      action: () => { navigate(`/board/${board.id}`); onClose(); },
    });
  });

  // Search cards in current board
  if (boardId) {
    const boardCards = store.getBoardCards(boardId);
    boardCards.forEach((card) => {
      const config = CARD_TYPE_CONFIG[card.type];
      const Icon = iconMap[config.icon] || FileText;
      commands.push({
        id: `card-${card.id}`,
        label: card.title || 'Без названия',
        group: 'Карточки',
        icon: Icon,
        action: () => { onClose(); },
      });
    });
  }

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const groups = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-[560px] max-h-[480px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите команду или поиск..."
            className="w-full px-4 py-4 pl-10 bg-transparent border-b border-border text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[380px] overflow-y-auto p-2">
          {Object.entries(groups).map(([group, cmds]) => (
            <div key={group}>
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              {cmds.map((cmd) => {
                const idx = flatIndex++;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-left truncate">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.5 bg-secondary rounded border border-border">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">Ничего не найдено</div>
          )}
        </div>
      </div>
    </div>
  );
}
