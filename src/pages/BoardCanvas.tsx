import { useCallback, useMemo, useRef, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ArtifactCardNode } from '@/components/canvas/ArtifactCardNode';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { CardDetailPanel } from '@/components/canvas/CardDetailPanel';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardType } from '@/types';

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
  }, []);

  const handleAddCard = useCallback(
    (type: CardType) => {
      if (!boardId) return;
      const posX = 200 + Math.random() * 400;
      const posY = 200 + Math.random() * 400;
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

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas-bg">
      {/* Top bar */}
      <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-semibold text-sm truncate">{board.name}</h2>
        <span className="text-xs text-muted-foreground">
          {boardCards.length} карточек
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative flex">
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
          className="flex-1"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(220, 15%, 15%)" />
          <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor="hsl(220, 70%, 55%)"
            maskColor="hsl(220, 20%, 7%, 0.7)"
          />
          <Panel position="bottom-center">
            <CanvasToolbar onAddCard={handleAddCard} />
          </Panel>
        </ReactFlow>

        {/* Detail Panel */}
        {selectedCard && (
          <CardDetailPanel
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
            onUpdate={(updates) => {
              store.updateCard(selectedCard.id, updates);
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedCard.id
                    ? { ...n, data: { card: { ...selectedCard, ...updates } } }
                    : n
                )
              );
            }}
            onDelete={() => handleDeleteCard(selectedCard.id)}
          />
        )}
      </div>
    </div>
  );
};

export default BoardCanvas;
