import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { BoardGridItem } from '@/components/BoardGridItem';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { Plus, Search, LayoutGrid, List, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BoardStatus } from '@/types';

const WorkspaceHome = () => {
  const { boards, deleteBoard, duplicateBoard, updateBoard } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BoardStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = boards
    .filter((b) => filter === 'all' || b.status === filter)
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const filters: { label: string; value: BoardStatus | 'all' }[] = [
    { label: 'Все', value: 'all' },
    { label: 'Активные', value: 'active' },
    { label: 'Избранные', value: 'favorite' },
    { label: 'Архив', value: 'archived' },
  ];

  if (boards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">THREADLINE</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Визуальная рабочая среда для идей, промтов, референсов и артефактов. Создайте свой первый борд.
          </p>
          <Button size="lg" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            Создать первый борд
          </Button>
          <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">THREADLINE</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {boards.length} {boards.length === 1 ? 'борд' : 'бордов'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Новый борд
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск бордов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Ничего не найдено
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((board) => (
            <BoardGridItem
              key={board.id}
              board={board}
              onClick={() => navigate(`/board/${board.id}`)}
              onDelete={() => deleteBoard(board.id)}
              onDuplicate={() => duplicateBoard(board.id)}
              onToggleFavorite={() =>
                updateBoard(board.id, { status: board.status === 'favorite' ? 'active' : 'favorite' })
              }
              onArchive={() =>
                updateBoard(board.id, { status: board.status === 'archived' ? 'active' : 'archived' })
              }
            />
          ))}
        </div>
      )}

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default WorkspaceHome;
