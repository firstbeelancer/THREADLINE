import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Board, Card, CardType, Connection, ConnectionType, ConnectionStyle, BoardStatus } from '@/types';

interface UndoAction {
  type: string;
  data: any;
}

interface WorkspaceState {
  boards: Board[];
  cards: Card[];
  connections: Connection[];
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Board actions
  createBoard: (name: string, description?: string) => string;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  duplicateBoard: (id: string) => string;

  // Card actions
  createCard: (boardId: string, type: CardType, posX?: number, posY?: number) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, posX: number, posY: number) => void;
  resizeCard: (id: string, width: number, height: number) => void;
  duplicateCard: (id: string) => string;

  // Connection actions
  createConnection: (boardId: string, sourceId: string, targetId: string, type?: ConnectionType) => string;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;

  // Board helpers
  getBoardCards: (boardId: string) => Card[];
  getBoardConnections: (boardId: string) => Connection[];
}

const defaultCardSize: Record<CardType, { width: number; height: number }> = {
  prompt: { width: 280, height: 200 },
  text: { width: 280, height: 180 },
  image: { width: 260, height: 240 },
  video: { width: 320, height: 220 },
  html: { width: 300, height: 220 },
  pptx: { width: 280, height: 200 },
  pdf: { width: 260, height: 200 },
  link: { width: 260, height: 160 },
  file: { width: 240, height: 160 },
  group: { width: 400, height: 300 },
  comment: { width: 220, height: 140 },
  todo: { width: 260, height: 220 },
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  boards: [],
  cards: [],
  connections: [],
  undoStack: [],
  redoStack: [],

  createBoard: (name, description = '') => {
    const id = uuid();
    const board: Board = {
      id,
      name,
      description,
      status: 'active',
      cardCount: 0,
      cardTypes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((s) => ({ boards: [...s.boards, board] }));
    return id;
  },

  updateBoard: (id, updates) => {
    set((s) => ({
      boards: s.boards.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b),
    }));
  },

  deleteBoard: (id) => {
    set((s) => ({
      boards: s.boards.filter((b) => b.id !== id),
      cards: s.cards.filter((c) => c.boardId !== id),
      connections: s.connections.filter((c) => c.boardId !== id),
    }));
  },

  duplicateBoard: (id) => {
    const board = get().boards.find((b) => b.id === id);
    if (!board) return '';
    const newId = uuid();
    set((s) => ({
      boards: [...s.boards, { ...board, id: newId, name: `${board.name} (копия)`, createdAt: new Date(), updatedAt: new Date() }],
    }));
    return newId;
  },

  createCard: (boardId, type, posX = 100, posY = 100) => {
    const id = uuid();
    const size = defaultCardSize[type];
    const card: Card = {
      id,
      boardId,
      type,
      title: '',
      description: '',
      content: {},
      tags: [],
      posX,
      posY,
      width: size.width,
      height: size.height,
      zIndex: get().cards.filter((c) => c.boardId === boardId).length,
      isLocked: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((s) => ({
      cards: [...s.cards, card],
      boards: s.boards.map((b) =>
        b.id === boardId
          ? { ...b, cardCount: b.cardCount + 1, cardTypes: [...new Set([...b.cardTypes, type])], updatedAt: new Date() }
          : b
      ),
    }));
    return id;
  },

  updateCard: (id, updates) => {
    set((s) => ({
      cards: s.cards.map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c),
    }));
  },

  deleteCard: (id) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    set((s) => ({
      cards: s.cards.filter((c) => c.id !== id),
      connections: s.connections.filter((c) => c.sourceId !== id && c.targetId !== id),
      boards: s.boards.map((b) =>
        b.id === card.boardId ? { ...b, cardCount: Math.max(0, b.cardCount - 1), updatedAt: new Date() } : b
      ),
    }));
  },

  moveCard: (id, posX, posY) => {
    set((s) => ({
      cards: s.cards.map((c) => c.id === id ? { ...c, posX, posY } : c),
    }));
  },

  resizeCard: (id, width, height) => {
    set((s) => ({
      cards: s.cards.map((c) => c.id === id ? { ...c, width, height } : c),
    }));
  },

  duplicateCard: (id) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return '';
    const newId = uuid();
    set((s) => ({
      cards: [...s.cards, { ...card, id: newId, posX: card.posX + 30, posY: card.posY + 30, createdAt: new Date(), updatedAt: new Date() }],
    }));
    return newId;
  },

  createConnection: (boardId, sourceId, targetId, type = 'related') => {
    const id = uuid();
    const conn: Connection = { id, boardId, sourceId, targetId, type, style: 'solid' };
    set((s) => ({ connections: [...s.connections, conn] }));
    return id;
  },

  updateConnection: (id, updates) => {
    set((s) => ({
      connections: s.connections.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
  },

  deleteConnection: (id) => {
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
  },

  getBoardCards: (boardId) => get().cards.filter((c) => c.boardId === boardId && !c.isArchived),
  getBoardConnections: (boardId) => get().connections.filter((c) => c.boardId === boardId),
}));
