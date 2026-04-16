import type { Card } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import { X, Trash2, Copy, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';

interface CardDetailPanelProps {
  card: Card;
  onClose: () => void;
  onUpdate: (updates: Partial<Card>) => void;
  onDelete: () => void;
}

export function CardDetailPanel({ card, onClose, onUpdate, onDelete }: CardDetailPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [tagInput, setTagInput] = useState('');
  const config = CARD_TYPE_CONFIG[card.type];

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
  }, [card.id, card.title, card.description]);

  const handleTitleBlur = () => {
    if (title !== card.title) onUpdate({ title });
  };
  const handleDescBlur = () => {
    if (description !== card.description) onUpdate({ description });
  };
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    onUpdate({ tags: [...card.tags, tagInput.trim()] });
    setTagInput('');
  };
  const handleRemoveTag = (tag: string) => {
    onUpdate({ tags: card.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="w-80 border-l border-border bg-card h-full overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded card-type-bg-${config.colorClass} card-type-text-${config.colorClass}`}>
          {config.label}
        </span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Название</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Без названия"
            className="bg-secondary"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Добавьте описание..."
            rows={3}
            className="bg-secondary resize-none"
          />
        </div>

        {/* Prompt-specific content */}
        {card.type === 'prompt' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Тело промта</label>
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="Введите промт..."
              rows={6}
              className="bg-secondary resize-none font-mono text-xs"
            />
          </div>
        )}

        {/* Link-specific */}
        {card.type === 'link' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL</label>
            <Input
              value={card.content?.url || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, url: e.target.value } })}
              placeholder="https://..."
              className="bg-secondary font-mono text-xs"
            />
          </div>
        )}

        {/* Text-specific */}
        {card.type === 'text' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Текст</label>
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="Введите текст..."
              rows={8}
              className="bg-secondary resize-none text-sm"
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Теги</label>
          <div className="flex gap-1 flex-wrap mb-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground cursor-pointer hover:bg-destructive/20"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
                <X className="w-2.5 h-2.5" />
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Новый тег"
              className="bg-secondary text-xs h-8"
            />
            <Button variant="outline" size="sm" onClick={handleAddTag} className="h-8 px-2">
              <Tag className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Создано: {new Date(card.createdAt).toLocaleString('ru-RU')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Обновлено: {new Date(card.updatedAt).toLocaleString('ru-RU')}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1 flex-1">
            <Trash2 className="w-3.5 h-3.5" />
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}
