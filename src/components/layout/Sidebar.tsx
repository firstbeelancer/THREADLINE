import { useRef, useState } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { Search, Plus, Activity, Pencil, Check, X } from 'lucide-react';

interface SidebarProps {
  activeBoardId: string | null;
  onSelectBoard: (id: string) => void;
}

const BOARD_COLORS = ['#10B981', '#3B82F6', '#A855F7', '#F97316', '#EF4444', '#EAB308', '#06B6D4', '#0EA5E9'];

export function Sidebar({ activeBoardId, onSelectBoard }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const store = useWorkspaceStore();

  const filtered = store.boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      store.updateBoard(editingId, { name: editValue.trim() });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="w-[252px] flex flex-col shrink-0 z-20 relative" style={{ background: 'hsl(240, 25%, 6%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Gradient line */}
      <div className="absolute top-0 right-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.1), rgba(16,185,129,0.05) 50%, transparent)' }} />

      {/* Logo */}
      <div className="px-[18px] pt-[18px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7, #10B981)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
            <Activity className="w-[15px] h-[15px] text-white" />
          </div>
          <span className="font-display text-base font-bold tracking-tight">
            THREAD<span className="bg-gradient-to-r from-[#A855F7] to-[#10B981] bg-clip-text text-transparent">LINE</span>
          </span>
        </div>
        <div className="text-[9.5px] text-[hsl(255,8%,40%)] uppercase tracking-widest ml-[38px] mt-0.5">Visual Workspace</div>
      </div>

      {/* Search */}
      <div className="px-3.5 pt-3 pb-1.5 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 translate-y-[2px] w-[13px] h-[13px] text-[hsl(255,8%,40%)] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск бордов..."
          className="w-full py-[7px] pl-[30px] pr-[11px] text-xs rounded-[7px] outline-none font-sans transition-all"
          style={{
            background: 'hsl(240, 20%, 9%)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'hsl(260, 20%, 92%)',
          }}
        />
      </div>

      {/* Section */}
      <div className="px-[18px] pt-3 pb-1.5 text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(255, 8%, 40%)' }}>
        Борды
      </div>

      {/* Board list */}
      <div className="flex-1 overflow-y-auto px-[7px] pb-[7px]">
        {filtered.map((board, i) => {
          const color = BOARD_COLORS[i % BOARD_COLORS.length];
          const isActive = board.id === activeBoardId;
          const isEditing = editingId === board.id;

          return (
            <div
              key={board.id}
              onClick={() => !isEditing && onSelectBoard(board.id)}
              className="flex items-center gap-[9px] py-[7px] px-[11px] rounded-[7px] cursor-pointer transition-all mb-px relative group/board"
              style={{ background: isActive ? 'hsl(240, 17%, 12%)' : undefined }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'hsl(240, 20%, 16%)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = ''; }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] rounded-r-sm" style={{ background: color }} />
              )}
              <div className="w-[7px] h-[7px] rounded-full shrink-0 relative" style={{ background: color }}>
                <div className="absolute inset-[-2px] rounded-full" style={{ background: color, opacity: 0.3, filter: 'blur(3px)' }} />
              </div>

              {isEditing ? (
                /* ── Inline edit mode ── */
                <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    onBlur={commitEdit}
                    className="flex-1 min-w-0 text-xs rounded-[5px] px-[6px] py-[3px] outline-none font-sans"
                    style={{
                      background: 'hsl(240, 25%, 15%)',
                      border: '1px solid rgba(168,85,247,0.4)',
                      color: 'hsl(260, 20%, 92%)',
                      boxShadow: '0 0 0 2px rgba(168,85,247,0.15)',
                    }}
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                    className="w-[18px] h-[18px] flex items-center justify-center rounded-[4px] shrink-0 transition-all"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                  >
                    <Check className="w-[10px] h-[10px]" />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                    className="w-[18px] h-[18px] flex items-center justify-center rounded-[4px] shrink-0 transition-all"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                  >
                    <X className="w-[10px] h-[10px]" />
                  </button>
                </div>
              ) : (
                /* ── Normal mode ── */
                <>
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: 'hsl(260, 20%, 92%)' }}
                    onDoubleClick={(e) => startEdit(board.id, board.name, e)}
                    title="Двойной клик — переименовать"
                  >
                    {board.name}
                  </span>

                  {/* Rename button — visible on hover */}
                  <button
                    className="opacity-0 group-hover/board:opacity-100 w-[18px] h-[18px] flex items-center justify-center rounded-[4px] shrink-0 transition-all"
                    style={{ color: 'hsl(255,8%,40%)' }}
                    onClick={(e) => startEdit(board.id, board.name, e)}
                    title="Переименовать"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.color = '#A855F7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsl(255,8%,40%)'; }}
                  >
                    <Pencil className="w-[9px] h-[9px]" />
                  </button>

                  <span
                    className="text-[9.5px] font-mono shrink-0 px-[5px] py-px rounded-[3px]"
                    style={{ color: 'hsl(255,8%,40%)', background: 'hsl(240, 20%, 9%)' }}
                  >
                    {board.cardCount}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* New board button */}
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-[5px] py-1.5 px-[11px] mx-[7px] mb-[7px] rounded-[7px] text-[11px] cursor-pointer transition-all font-sans"
        style={{
          border: '1px dashed rgba(255,255,255,0.08)',
          background: 'transparent',
          color: 'hsl(255,8%,40%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
          e.currentTarget.style.color = 'hsl(255,8%,62%)';
          e.currentTarget.style.background = 'hsl(240, 20%, 9%)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'hsl(255,8%,40%)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Plus className="w-[13px] h-[13px]" />
        Новый борд
      </button>

      {/* User */}
      <div className="px-3.5 py-2.5 flex items-center gap-[9px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #A855F7, #10B981)', boxShadow: '0 0 10px rgba(168,85,247,0.2)' }}>
          U
        </div>
        <div>
          <div className="text-[11.5px] font-semibold" style={{ color: 'hsl(260, 20%, 92%)' }}>User</div>
          <div className="text-[9.5px]" style={{ color: 'hsl(255,8%,40%)' }}>user@threadline.io</div>
        </div>
      </div>

      <CreateBoardDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={onSelectBoard} />
    </div>
  );
}
