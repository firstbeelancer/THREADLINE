import type { Board } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import { Star, Archive, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BoardGridItemProps {
  board: Board;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
}

export function BoardGridItem({ board, onClick, onDelete, onDuplicate, onToggleFavorite, onArchive }: BoardGridItemProps) {
  const timeAgo = getTimeAgo(board.updatedAt);

  return (
    <div
      className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-secondary to-accent flex items-center justify-center relative">
        <span className="text-3xl font-bold text-muted-foreground/30 select-none">
          {board.name.charAt(0).toUpperCase()}
        </span>
        {board.status === 'favorite' && (
          <Star className="absolute top-2 left-2 w-4 h-4 text-yellow-500 fill-yellow-500" />
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md bg-card/80 backdrop-blur hover:bg-card"
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Star className="w-4 h-4 mr-2" />
                {board.status === 'favorite' ? 'Убрать из избранных' : 'В избранное'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="w-4 h-4 mr-2" />
                {board.status === 'archived' ? 'Разархивировать' : 'Архивировать'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm truncate mb-1">{board.name}</h3>
        {board.description && (
          <p className="text-xs text-muted-foreground truncate mb-2">{board.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{board.cardCount} карточек</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        {board.cardTypes.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {board.cardTypes.slice(0, 5).map((t) => (
              <span
                key={t}
                className={`text-[10px] px-1.5 py-0.5 rounded card-type-bg-${t} card-type-text-${t} font-medium`}
              >
                {CARD_TYPE_CONFIG[t].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}
