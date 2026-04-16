import type { Card } from '@/types';
import { CARD_TYPE_CONFIG } from '@/types';
import { X, Trash2, Tag, Upload, FileUp, Plus, Square, CheckSquare2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideFileRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const newWidth = card.width;
      const newHeight = Math.round(newWidth / aspectRatio);
      onUpdate({
        content: { ...card.content, imageUrl: url, imageWidth: img.width, imageHeight: img.height },
        width: newWidth,
        height: newHeight,
      });
    };
    img.src = url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({
      content: {
        ...card.content,
        fileUrl: url,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileMime: file.type,
      },
    });
  };

  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onUpdate({ content: { ...card.content, body: text, fileName: file.name } });
    };
    reader.readAsText(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Determine file accept type based on card type
  const getFileAccept = () => {
    switch (card.type) {
      case 'pdf': return '.pdf';
      case 'pptx': return '.pptx,.ppt';
      case 'video': return 'video/*';
      case 'file': return '*';
      default: return '*';
    }
  };

  // Types that support file upload
  const hasFileUpload = ['pdf', 'pptx', 'video', 'file'].includes(card.type);
  const hasHtmlUpload = card.type === 'html';

  return (
    <div className="w-80 h-full overflow-y-auto animate-fade-in flex flex-col" style={{ background: 'hsl(240, 25%, 6%)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span
          className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded-[5px]"
          style={{
            background: `var(--glow-${config.colorClass}-soft, rgba(255,255,255,0.05))`,
            color: `var(--glow-${config.colorClass}, hsl(255,8%,62%))`,
          }}
        >
          {config.label}
        </span>
        <span className="font-display text-sm font-bold flex-1 truncate" style={{ color: 'hsl(260, 20%, 92%)' }}>
          {card.title || 'Без названия'}
        </span>
        <button
          onClick={onClose}
          className="w-[26px] h-[26px] flex items-center justify-center rounded-[5px] transition-all"
          style={{ color: 'hsl(255,8%,62%)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(240, 20%, 16%)'; e.currentTarget.style.color = 'hsl(260, 20%, 92%)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsl(255,8%,62%)'; }}
        >
          <X className="w-[13px] h-[13px]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Title */}
        <Field label="Название">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Без названия"
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] text-xs"
          />
        </Field>

        {/* Description */}
        <Field label="Описание">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Добавьте описание..."
            rows={3}
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none text-xs"
          />
        </Field>

        {/* Prompt body */}
        {card.type === 'prompt' && (
          <Field label="Тело промта">
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="Введите промт..."
              rows={6}
              className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none font-mono text-[10.5px]"
            />
          </Field>
        )}

        {/* Text body */}
        {card.type === 'text' && (
          <Field label="Текст">
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="Введите текст..."
              rows={8}
              className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none text-xs"
            />
          </Field>
        )}

        {/* Link URL */}
        {card.type === 'link' && (
          <LinkEditor card={card} onUpdate={onUpdate} />
        )}

        {/* Image upload */}
        {card.type === 'image' && (
          <Field label="Изображение">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {card.content?.imageUrl ? (
              <div className="space-y-2">
                <img src={card.content.imageUrl} alt={card.title || ''} className="w-full rounded-[7px] object-contain" style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
                <UploadButton onClick={() => fileInputRef.current?.click()} label="Заменить изображение" />
              </div>
            ) : (
              <UploadDropzone onClick={() => fileInputRef.current?.click()} label="Загрузить изображение" />
            )}
          </Field>
        )}

        {/* HTML file/editor */}
        {hasHtmlUpload && (
          <Field label="HTML-код">
            <input ref={fileInputRef} type="file" accept=".html,.htm,.svg" onChange={handleHtmlFileUpload} className="hidden" />
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="<div>Your HTML here</div>"
              rows={6}
              className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none font-mono text-[10.5px]"
            />
            <UploadButton onClick={() => fileInputRef.current?.click()} label={card.content?.fileName ? `Файл: ${card.content.fileName}` : 'Загрузить HTML-файл'} />
            {card.content?.body && (
              <div className="mt-2">
                <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(255,8%,40%)' }}>Превью</div>
                <div className="rounded-[7px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <iframe
                    srcDoc={card.content.body}
                    sandbox="allow-scripts"
                    className="w-full border-0"
                    style={{ minHeight: 150, background: '#fff' }}
                    title="HTML Preview"
                  />
                </div>
              </div>
            )}
          </Field>
        )}

        {/* PDF / PPTX / Video / File upload */}
        {hasFileUpload && (
          <Field label="Файл">
            <input ref={fileInputRef} type="file" accept={getFileAccept()} onChange={handleFileUpload} className="hidden" />
            {card.content?.fileUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-[7px]" style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <FileUp className="w-5 h-5 shrink-0" style={{ color: 'hsl(255,8%,62%)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10.5px] font-medium truncate" style={{ color: 'hsl(255,8%,62%)' }}>{card.content.fileName}</div>
                    <div className="text-[9.5px] font-mono" style={{ color: 'hsl(255,8%,40%)' }}>{card.content.fileSize}</div>
                  </div>
                </div>
                <UploadButton onClick={() => fileInputRef.current?.click()} label="Заменить файл" />
              </div>
            ) : (
              <UploadDropzone onClick={() => fileInputRef.current?.click()} label={`Загрузить ${config.label}-файл`} />
            )}
          </Field>
        )}

        {/* PPTX slides */}
        {card.type === 'pptx' && (
          <Field label="Слайды">
            <input
              ref={slideFileRef}
              type="file"
              accept=".html,.htm"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const existing: string[] = card.content?.slides || [];
                let loaded = 0;
                const newSlides: string[] = [];
                files.forEach((file) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    newSlides.push(ev.target?.result as string);
                    loaded++;
                    if (loaded === files.length) {
                      onUpdate({ content: { ...card.content, slides: [...existing, ...newSlides] } });
                    }
                  };
                  reader.readAsText(file);
                });
              }}
              className="hidden"
            />
            {(card.content?.slides as string[] || []).length > 0 && (
              <div className="space-y-2 mb-2">
                {(card.content.slides as string[]).map((_: string, i: number) => (
                  <div key={i} className="rounded-[7px] overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <iframe
                      srcDoc={_}
                      sandbox="allow-scripts"
                      className="w-full border-0 pointer-events-none"
                      style={{ height: 120, background: '#fff' }}
                      title={`Slide ${i + 1}`}
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={() => {
                          const slides = [...(card.content?.slides || [])];
                          slides.splice(i, 1);
                          onUpdate({ content: { ...card.content, slides } });
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded text-[9px] cursor-pointer"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#EF4444' }}
                        title="Удалить слайд"
                      >
                        ×
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 text-[8px] font-mono px-1 py-px rounded" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.5)' }}>
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <UploadButton onClick={() => slideFileRef.current?.click()} label="Добавить слайды (HTML)" />
            <div className="mt-1.5">
              <Textarea
                placeholder="Или вставьте HTML-код слайда..."
                rows={4}
                className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none font-mono text-[10.5px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    const val = (e.target as HTMLTextAreaElement).value.trim();
                    if (val) {
                      const existing: string[] = card.content?.slides || [];
                      onUpdate({ content: { ...card.content, slides: [...existing, val] } });
                      (e.target as HTMLTextAreaElement).value = '';
                    }
                  }
                }}
              />
              <div className="text-[9px] mt-0.5" style={{ color: 'hsl(255,8%,40%)' }}>Ctrl+Enter — добавить слайд</div>
            </div>
          </Field>
        )}

        {/* To-Do items */}
        {card.type === 'todo' && (
          <TodoEditor card={card} onUpdate={onUpdate} />
        )}

        {card.type === 'comment' && (
          <Field label="Комментарий">
            <Textarea
              value={card.content?.body || ''}
              onChange={(e) => onUpdate({ content: { ...card.content, body: e.target.value } })}
              placeholder="Ваш комментарий..."
              rows={4}
              className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none text-xs"
            />
          </Field>
        )}

        {/* Tags */}
        <Field label="Теги">
          <div className="flex gap-1 flex-wrap mb-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-[4px] cursor-pointer transition-all"
                style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)', color: 'hsl(255,8%,62%)' }}
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
              className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] text-xs h-8"
            />
            <Button variant="outline" size="sm" onClick={handleAddTag} className="h-8 px-2">
              <Tag className="w-3 h-3" />
            </Button>
          </div>
        </Field>

        {/* Meta */}
        <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[9.5px] font-mono" style={{ color: 'hsl(255,8%,40%)' }}>
            Создано: {new Date(card.createdAt).toLocaleString('ru-RU')}
          </p>
          <p className="text-[9.5px] font-mono" style={{ color: 'hsl(255,8%,40%)' }}>
            Обновлено: {new Date(card.updatedAt).toLocaleString('ru-RU')}
          </p>
        </div>

        {/* Delete */}
        <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1 w-full">
          <Trash2 className="w-3.5 h-3.5" />
          Удалить
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(255,8%,40%)' }}>{label}</div>
      {children}
    </div>
  );
}

function UploadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 w-full py-[5px] px-[10px] rounded-md text-[10.5px] cursor-pointer transition-all"
      style={{ background: 'hsl(240, 20%, 9%)', border: '1px solid rgba(255,255,255,0.05)', color: 'hsl(255,8%,62%)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(240, 17%, 12%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'hsl(260, 20%, 92%)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(240, 20%, 9%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'hsl(255,8%,62%)'; }}
    >
      <Upload className="w-[11px] h-[11px]" />
      {label}
    </button>
  );
}

function UploadDropzone({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-20 flex flex-col items-center justify-center gap-2 rounded-[7px] cursor-pointer transition-all"
      style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'transparent', color: 'hsl(255,8%,40%)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.background = 'hsl(240, 20%, 9%)'; e.currentTarget.style.color = 'hsl(255,8%,62%)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(255,8%,40%)'; }}
    >
      <Upload className="w-5 h-5" />
      <span className="text-[10.5px]">{label}</span>
    </button>
  );
}

interface TodoItem { text: string; done: boolean }

function TodoEditor({ card, onUpdate }: { card: Card; onUpdate: (updates: Partial<Card>) => void }) {
  const [newItem, setNewItem] = useState('');
  const items: TodoItem[] = card.content?.items || [];

  const toggle = (i: number) => {
    const updated = items.map((item, idx) => idx === i ? { ...item, done: !item.done } : item);
    onUpdate({ content: { ...card.content, items: updated } });
  };

  const remove = (i: number) => {
    onUpdate({ content: { ...card.content, items: items.filter((_, idx) => idx !== i) } });
  };

  const add = () => {
    if (!newItem.trim()) return;
    onUpdate({ content: { ...card.content, items: [...items, { text: newItem.trim(), done: false }] } });
    setNewItem('');
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <Field label={`Задачи (${doneCount}/${items.length})`}>
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'hsl(240, 20%, 9%)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / items.length) * 100}%`, background: '#22C55E' }} />
        </div>
      )}

      <div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 group/item">
            <button onClick={() => toggle(i)} className="shrink-0 cursor-pointer">
              {item.done ? (
                <CheckSquare2 className="w-[14px] h-[14px]" style={{ color: '#22C55E' }} />
              ) : (
                <Square className="w-[14px] h-[14px]" style={{ color: 'hsl(255,8%,40%)' }} />
              )}
            </button>
            <span className={`text-[11px] flex-1 ${item.done ? 'line-through' : ''}`} style={{ color: item.done ? 'hsl(255,8%,40%)' : 'hsl(260, 20%, 92%)' }}>
              {item.text}
            </span>
            <button
              onClick={() => remove(i)}
              className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 cursor-pointer"
              style={{ color: 'hsl(255,8%,40%)' }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Новая задача..."
          className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] text-xs h-8"
        />
        <Button variant="outline" size="sm" onClick={add} className="h-8 px-2">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </Field>
  );
}

function LinkEditor({ card, onUpdate }: { card: Card; onUpdate: (updates: Partial<Card>) => void }) {
  const [url, setUrl] = useState(card.content?.url || '');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setUrl(card.content?.url || '');
  }, [card.id, card.content?.url]);

  const parseUrl = async (rawUrl: string) => {
    if (!rawUrl.trim()) return;
    let finalUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    
    const updates: Record<string, any> = { ...card.content, url: finalUrl };
    
    try {
      const hostname = new URL(finalUrl).hostname;
      updates.ogTitle = updates.ogTitle || hostname;
    } catch { /* invalid URL */ }

    // Try fetching OG metadata via a CORS proxy
    setFetching(true);
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      const html = await res.text();
      
      const getMetaContent = (property: string) => {
        const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
        const altRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
        return regex.exec(html)?.[1] || altRegex.exec(html)?.[1] || '';
      };

      const ogTitle = getMetaContent('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
      const ogDescription = getMetaContent('og:description') || getMetaContent('description');
      const ogImage = getMetaContent('og:image');

      if (ogTitle) updates.ogTitle = ogTitle;
      if (ogDescription) updates.ogDescription = ogDescription;
      if (ogImage) {
        // Resolve relative URLs
        if (ogImage.startsWith('/')) {
          try { updates.ogImage = new URL(ogImage, finalUrl).href; } catch { updates.ogImage = ogImage; }
        } else {
          updates.ogImage = ogImage;
        }
      }
    } catch {
      // Proxy failed — that's okay, we still have favicon + domain
    }
    setFetching(false);
    onUpdate({ content: updates });
  };

  return (
    <>
      <Field label="URL">
        <div className="flex gap-1">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && parseUrl(url)}
            onBlur={() => { if (url !== card.content?.url) parseUrl(url); }}
            placeholder="https://..."
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] font-mono text-[10.5px]"
          />
        </div>
        {fetching && (
          <div className="text-[9px] mt-1 animate-pulse" style={{ color: 'hsl(255,8%,40%)' }}>Загрузка превью...</div>
        )}
      </Field>

      {card.content?.url && (
        <Field label="Превью">
          <a
            href={card.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[7px] overflow-hidden transition-all hover:brightness-110 no-underline"
            style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {card.content.ogImage && (
              <div className="w-full aspect-video overflow-hidden">
                <img src={card.content.ogImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-2.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(card.content.url).hostname}&sz=32`}
                  alt=""
                  className="w-4 h-4 rounded-[2px] shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-[11px] font-medium" style={{ color: 'hsl(260, 20%, 92%)' }}>
                  {card.content.ogTitle || new URL(card.content.url).hostname}
                </span>
              </div>
              {card.content.ogDescription && (
                <span className="text-[10px] line-clamp-2" style={{ color: 'hsl(255,8%,62%)' }}>
                  {card.content.ogDescription}
                </span>
              )}
              <span className="text-[9px] font-mono truncate" style={{ color: '#0EA5E9', opacity: 0.7 }}>
                {card.content.url}
              </span>
            </div>
          </a>
        </Field>
      )}

      {card.content?.url && (
        <Field label="Мета-данные">
          <Input
            value={card.content?.ogTitle || ''}
            onChange={(e) => onUpdate({ content: { ...card.content, ogTitle: e.target.value } })}
            placeholder="Заголовок"
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] text-xs mb-1.5"
          />
          <Input
            value={card.content?.ogDescription || ''}
            onChange={(e) => onUpdate({ content: { ...card.content, ogDescription: e.target.value } })}
            placeholder="Описание"
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] text-xs mb-1.5"
          />
          <Input
            value={card.content?.ogImage || ''}
            onChange={(e) => onUpdate({ content: { ...card.content, ogImage: e.target.value } })}
            placeholder="URL изображения"
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] font-mono text-[10.5px]"
          />
        </Field>
      )}
    </>
  );
}
