export type CardType = 'prompt' | 'text' | 'image' | 'video' | 'html' | 'pptx' | 'pdf' | 'link' | 'file' | 'group' | 'comment' | 'todo' | 'voice';

export type ConnectionType = 'related' | 'source_of' | 'evolved_into' | 'used_in' | 'reference_for' | 'based_on' | 'derived_from' | 'resulted_in' | 'part_of';

export type ConnectionStyle = 'solid' | 'dashed' | 'dotted';

export type BoardStatus = 'active' | 'archived' | 'favorite';

export interface Board {
  id: string;
  name: string;
  description: string;
  status: BoardStatus;
  coverUrl?: string;
  cardCount: number;
  cardTypes: CardType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  boardId: string;
  type: CardType;
  title: string;
  description: string;
  content: Record<string, any>;
  tags: string[];
  posX: number;
  posY: number;
  width: number;
  height: number;
  zIndex: number;
  isLocked: boolean;
  isArchived: boolean;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  boardId: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  style: ConnectionStyle;
  color?: string;
  note?: string;
}

export const CARD_TYPE_CONFIG: Record<CardType, { label: string; icon: string; colorClass: string }> = {
  prompt: { label: 'Prompt', icon: 'Sparkles', colorClass: 'prompt' },
  text: { label: 'Text', icon: 'FileText', colorClass: 'text' },
  image: { label: 'Image', icon: 'Image', colorClass: 'image' },
  video: { label: 'Video', icon: 'Play', colorClass: 'video' },
  html: { label: 'HTML', icon: 'Code2', colorClass: 'html' },
  pptx: { label: 'PPTX', icon: 'Presentation', colorClass: 'pptx' },
  pdf: { label: 'PDF', icon: 'FileType', colorClass: 'pdf' },
  link: { label: 'Link', icon: 'Link2', colorClass: 'link' },
  file: { label: 'File', icon: 'Paperclip', colorClass: 'file' },
  group: { label: 'Group', icon: 'Layers', colorClass: 'group' },
  comment: { label: 'Comment', icon: 'MessageSquare', colorClass: 'comment' },
  todo: { label: 'To-Do', icon: 'CheckSquare', colorClass: 'todo' },
  voice: { label: 'Voice', icon: 'Mic', colorClass: 'voice' },
};

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  related: 'Связано с',
  source_of: 'Источник для',
  evolved_into: 'Выросло в',
  used_in: 'Использовано в',
  reference_for: 'Референс для',
  based_on: 'Основано на',
  derived_from: 'Производное от',
  resulted_in: 'Дало результат',
  part_of: 'Входит в тему',
};
