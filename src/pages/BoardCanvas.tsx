import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection as RFConnection,
  type NodeTypes,
  BackgroundVariant,
  Panel,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ArtifactCardNode } from '@/components/canvas/ArtifactCardNode';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { CardDetailPanel } from '@/components/canvas/CardDetailPanel';
import { CommandPalette } from '@/components/canvas/CommandPalette';
import { CanvasContextMenu } from '@/components/canvas/CanvasContextMenu';
import { ArrowLeft, Maximize, Undo2, Redo2, Plus, ImageDown, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardType } from '@/types';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  artifactCard: ArtifactCardNode,
};

const BoardCanvas = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const store = useWorkspaceStore();
  const board = store.boards.find((b) => b.id === boardId);
  const boardCards = store.getBoardCards(boardId || '');
  const boardConnections = store.getBoardConnections(boardId || '');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const initialNodes: Node[] = useMemo(
    () =>
      boardCards.map((card) => ({
        id: card.id,
        type: 'artifactCard',
        position: { x: card.posX, y: card.posY },
        data: { card },
        style: { width: card.width, height: card.height },
      })),
    [boardCards]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      boardConnections.map((conn) => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        type: 'default',
        style: {
          strokeDasharray: conn.style === 'dashed' ? '8 4' : conn.style === 'dotted' ? '2 2' : undefined,
          stroke: conn.color || 'hsl(220, 15%, 35%)',
        },
        label: conn.note,
      })),
    [boardConnections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: RFConnection) => {
      if (!boardId || !params.source || !params.target) return;
      const id = store.createConnection(boardId, params.source, params.target);
      setEdges((eds) =>
        addEdge({ ...params, id, style: { stroke: 'hsl(220, 15%, 35%)' } }, eds)
      );
    },
    [boardId, store, setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      store.moveCard(node.id, node.position.x, node.position.y);
    },
    [store]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedCardId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedCardId(null);
    setCtxMenu(null);
  }, []);

  const handleAddCard = useCallback(
    (type: CardType, screenX?: number, screenY?: number) => {
      if (!boardId) return;
      const posX = (screenX ?? 200) + Math.random() * 100;
      const posY = (screenY ?? 200) + Math.random() * 100;
      const cardId = store.createCard(boardId, type, posX, posY);
      const freshCards = useWorkspaceStore.getState().cards;
      const card = freshCards.find((c) => c.id === cardId);
      if (!card) return;
      setNodes((nds) => [
        ...nds,
        {
          id: card.id,
          type: 'artifactCard',
          position: { x: card.posX, y: card.posY },
          data: { card },
          style: { width: card.width, height: card.height },
        },
      ]);
    },
    [boardId, store, setNodes]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      store.deleteCard(id);
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      if (selectedCardId === id) setSelectedCardId(null);
    },
    [store, setNodes, setEdges, selectedCardId]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const isInput = () => {
      const el = document.activeElement;
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
    };

    const handler = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
      }
      // Escape
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setSelectedCardId(null);
        setCtxMenu(null);
        return;
      }
      if (isInput() || cmdOpen) return;

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCardId) {
        e.preventDefault();
        handleDeleteCard(selectedCardId);
        return;
      }
      // Quick card creation
      if (e.key === 'p') handleAddCard('prompt');
      if (e.key === 't') handleAddCard('text');
      if (e.key === 'h') handleAddCard('html');
      if (e.key === 'i') handleAddCard('image');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCardId, cmdOpen, handleAddCard, handleDeleteCard]);

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const boardName = board?.name || 'board';

  const exportToImage = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el || nodes.length === 0) { toast.info('Нет карточек для экспорта'); return; }
    toast.info('Экспорт PNG...');
    try {
      const bounds = getNodesBounds(nodes);
      const pad = 80;
      const w = bounds.width + pad * 2;
      const h = bounds.height + pad * 2;
      const vp = getViewportForBounds(bounds, w, h, 0.01, 10, pad);
      const dataUrl = await toPng(el, {
        width: w, height: h,
        style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        backgroundColor: 'hsl(240, 30%, 5%)',
      });
      const a = document.createElement('a');
      a.href = dataUrl; a.download = `${boardName}.png`; a.click();
      toast.success('PNG сохранён');
    } catch (err) { toast.error('Ошибка экспорта PNG'); console.error(err); }
  }, [nodes, boardName]);

  const exportToPdf = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el || nodes.length === 0) { toast.info('Нет карточек для экспорта'); return; }
    toast.info('Экспорт PDF...');
    try {
      const bounds = getNodesBounds(nodes);
      const pad = 80;
      const w = bounds.width + pad * 2;
      const h = bounds.height + pad * 2;
      const vp = getViewportForBounds(bounds, w, h, 0.01, 10, pad);
      const dataUrl = await toPng(el, {
        width: w, height: h,
        style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        backgroundColor: 'hsl(240, 30%, 5%)',
      });
      const orientation = w > h ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
      pdf.save(`${boardName}.pdf`);
      toast.success('PDF сохранён');
    } catch (err) { toast.error('Ошибка экспорта PDF'); console.error(err); }
  }, [nodes, boardName]);

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Борд не найден</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  const selectedCard = boardCards.find((c) => c.id === selectedCardId);

  const exportToImage = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el || nodes.length === 0) { toast.info('Нет карточек для экспорта'); return; }
    toast.info('Экспорт PNG...');
    try {
      const bounds = getNodesBounds(nodes);
      const pad = 80;
      const w = bounds.width + pad * 2;
      const h = bounds.height + pad * 2;
      const vp = getViewportForBounds(bounds, w, h, 0.01, 10, pad);
      const dataUrl = await toPng(el, {
        width: w, height: h,
        style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        backgroundColor: 'hsl(240, 30%, 5%)',
      });
      const a = document.createElement('a');
      a.href = dataUrl; a.download = `${board?.name || 'board'}.png`; a.click();
      toast.success('PNG сохранён');
    } catch (err) { toast.error('Ошибка экспорта PNG'); console.error(err); }
  }, [nodes, board]);

  const exportToPdf = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el || nodes.length === 0) { toast.info('Нет карточек для экспорта'); return; }
    toast.info('Экспорт PDF...');
    try {
      const bounds = getNodesBounds(nodes);
      const pad = 80;
      const w = bounds.width + pad * 2;
      const h = bounds.height + pad * 2;
      const vp = getViewportForBounds(bounds, w, h, 0.01, 10, pad);
      const dataUrl = await toPng(el, {
        width: w, height: h,
        style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
        backgroundColor: 'hsl(240, 30%, 5%)',
      });
      const orientation = w > h ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
      pdf.save(`${board?.name || 'board'}.pdf`);
      toast.success('PDF сохранён');
    } catch (err) { toast.error('Ошибка экспорта PDF'); console.error(err); }
  }, [nodes, board]);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: 'hsl(240, 30%, 5%)' }}>
      {/* Top bar */}
      <div className="h-[52px] border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-display font-bold text-sm truncate">{board.name}</h2>
        <span className="text-xs text-muted-foreground">
          {boardCards.length} карточек
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={exportToImage} title="Экспорт PNG">
          <ImageDown className="w-3.5 h-3.5" />
          PNG
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={exportToPdf} title="Экспорт PDF">
          <FileDown className="w-3.5 h-3.5" />
          PDF
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Командная палитра (Ctrl+K)" onClick={() => setCmdOpen(true)}>
          <span className="text-xs font-mono text-muted-foreground">⌘K</span>
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative flex" onContextMenu={handleContextMenu}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.01}
          maxZoom={10}
          className="flex-1"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={40} size={1} color="rgba(255,255,255,0.03)" />
          <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor="hsl(160, 72%, 47%)"
            maskColor="rgba(10,10,15,0.7)"
          />
          <Panel position="bottom-center">
            <CanvasToolbar onAddCard={handleAddCard} />
          </Panel>

          {/* Empty state */}
          {boardCards.length === 0 && (
            <Panel position="top-center" className="mt-[30vh]">
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm mb-1">Добавьте первую карточку</p>
                <p className="text-muted-foreground/60 text-xs">
                  Используйте панель инструментов, ПКМ или клавиши P, T, H, I
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Detail Panel */}
        {selectedCard && (
          <CardDetailPanel
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
            onUpdate={(updates) => {
              store.updateCard(selectedCard.id, updates);
              const updatedCard = { ...selectedCard, ...updates };
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedCard.id
                    ? {
                        ...n,
                        data: { card: updatedCard },
                        style: { width: updates.width ?? n.style?.width, height: updates.height ?? n.style?.height },
                      }
                    : n
                )
              );
            }}
            onDelete={() => handleDeleteCard(selectedCard.id)}
          />
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <CanvasContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onAddCard={(type) => handleAddCard(type)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Command palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAddCard={(type) => handleAddCard(type)}
        boardId={boardId}
      />
    </div>
  );
};

export default BoardCanvas;
