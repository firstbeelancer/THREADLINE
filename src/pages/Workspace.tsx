import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ArtifactCardNode } from '@/components/canvas/ArtifactCardNode';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { CardDetailPanel } from '@/components/canvas/CardDetailPanel';
import { CommandPalette } from '@/components/canvas/CommandPalette';
import { CanvasContextMenu } from '@/components/canvas/CanvasContextMenu';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusBar } from '@/components/layout/StatusBar';
import { WelcomeOverlay } from '@/components/layout/WelcomeOverlay';
import { Plus } from 'lucide-react';
import type { CardType } from '@/types';

const nodeTypes: NodeTypes = {
  artifactCard: ArtifactCardNode,
};

const Workspace = () => {
  const store = useWorkspaceStore();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Auto-select first board
  useEffect(() => {
    if (!activeBoardId && store.boards.length > 0) {
      setActiveBoardId(store.boards[0].id);
    }
  }, [store.boards, activeBoardId]);

  const board = store.boards.find((b) => b.id === activeBoardId) || null;
  const boardCards = activeBoardId ? store.getBoardCards(activeBoardId) : [];
  const boardConnections = activeBoardId ? store.getBoardConnections(activeBoardId) : [];

  const initialNodes: Node[] = useMemo(
    () =>
      boardCards.map((card) => ({
        id: card.id,
        type: 'artifactCard',
        position: { x: card.posX, y: card.posY },
        data: { card },
        style: { width: card.width, height: card.height },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeBoardId, boardCards.length]
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
          stroke: conn.color || 'rgba(255,255,255,0.12)',
        },
        label: conn.note,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeBoardId, boardConnections.length]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when board changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedCardId(null);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: RFConnection) => {
      if (!activeBoardId || !params.source || !params.target) return;
      const id = store.createConnection(activeBoardId, params.source, params.target);
      setEdges((eds) =>
        addEdge({ ...params, id, style: { stroke: 'rgba(255,255,255,0.12)' } }, eds)
      );
    },
    [activeBoardId, store, setEdges]
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
      if (!activeBoardId) return;
      const posX = (screenX ?? 200) + Math.random() * 100;
      const posY = (screenY ?? 200) + Math.random() * 100;
      const cardId = store.createCard(activeBoardId, type, posX, posY);
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
    [activeBoardId, store, setNodes]
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setSelectedCardId(null);
        setCtxMenu(null);
        return;
      }
      if (isInput() || cmdOpen) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCardId) {
        e.preventDefault();
        handleDeleteCard(selectedCardId);
        return;
      }
      if (e.key === 'p') handleAddCard('prompt');
      if (e.key === 't') handleAddCard('text');
      if (e.key === 'h') handleAddCard('html');
      if (e.key === 'i') handleAddCard('image');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCardId, cmdOpen, handleAddCard, handleDeleteCard]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleSelectBoard = useCallback((id: string) => {
    setActiveBoardId(id);
  }, []);

  const selectedCard = boardCards.find((c) => c.id === selectedCardId);

  // If no boards exist and welcome dismissed, create first board
  const handleEnterWorkspace = useCallback(() => {
    setShowWelcome(false);
    if (store.boards.length === 0) {
      const id = store.createBoard('Мой первый борд', 'Начало работы');
      setActiveBoardId(id);
    }
  }, [store]);

  return (
    <div className="h-screen w-screen flex" style={{ background: 'hsl(240, 33%, 4%)' }}>
      {showWelcome && <WelcomeOverlay onEnter={handleEnterWorkspace} />}

      <Sidebar activeBoardId={activeBoardId} onSelectBoard={handleSelectBoard} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar board={board} cardCount={boardCards.length} onToggleCmd={() => setCmdOpen(true)} />

        {/* Canvas area */}
        <div className="flex-1 relative flex" onContextMenu={handleContextMenu}>
          {activeBoardId ? (
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
              minZoom={0.02}
              maxZoom={8}
              className="flex-1"
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(255,255,255,0.022)" />
              <Controls className="!bg-[hsl(240,20%,9%)] !border-[rgba(255,255,255,0.08)] !shadow-lg [&>button]:!bg-[hsl(240,20%,9%)] [&>button]:!border-[rgba(255,255,255,0.05)] [&>button]:!text-[hsl(255,8%,62%)] [&>button:hover]:!bg-[hsl(240,17%,12%)]" />
              <MiniMap
                className="!bg-[hsl(240,20%,9%)] !border-[rgba(255,255,255,0.08)]"
                nodeColor="#10B981"
                maskColor="rgba(7,7,13,0.7)"
                style={{ width: 170, height: 110, borderRadius: 9 }}
              />
              <Panel position="bottom-center">
                <CanvasToolbar onAddCard={handleAddCard} />
              </Panel>

              {boardCards.length === 0 && (
                <Panel position="top-center" className="mt-[30vh]">
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(240, 17%, 12%)' }}>
                      <Plus className="w-8 h-8" style={{ color: 'hsl(255,8%,40%)' }} />
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'hsl(255,8%,62%)' }}>Добавьте первую карточку</p>
                    <p className="text-xs" style={{ color: 'hsl(255,8%,40%)' }}>
                      Используйте панель внизу, ПКМ или клавиши P, T, H, I
                    </p>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'hsl(255,8%,40%)' }}>Выберите борд или создайте новый</p>
            </div>
          )}

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

        <StatusBar cardCount={boardCards.length} connectionCount={boardConnections.length} />
      </div>

      {ctxMenu && (
        <CanvasContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onAddCard={(type) => handleAddCard(type)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAddCard={(type) => handleAddCard(type)}
        boardId={activeBoardId ?? undefined}
      />
    </div>
  );
};

export default Workspace;
