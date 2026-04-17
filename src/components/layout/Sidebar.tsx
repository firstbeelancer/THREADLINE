import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { useAuth } from '@/hooks/useAuth';
import {
  Search, Plus, Pencil, Check, X, MoreHorizontal, Pin, PinOff,
  Share2, Download, Trash2, Settings, LogOut, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  activeBoardId: string | null;
  onSelectBoard: (id: string) => void;
}

const BOARD_COLORS = ['#10B981', '#3B82F6', '#A855F7', '#F97316', '#EF4444', '#EAB308', '#06B6D4', '#0EA5E9'];

export function Sidebar({ activeBoardId, onSelectBoard }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const store = useWorkspaceStore();

  const sorted = [...store.boards].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const filtered = sorted.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
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

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    toast.success('Вы вышли из аккаунта');
  };

  const togglePin = (boardId: string, isPinned: boolean | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    store.updateBoard(boardId, { isPinned: !isPinned });
    setMenuOpenId(null);
  };

  const shareBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Ссылка скопирована');
    });
    setMenuOpenId(null);
  };

  const exportBoard = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cards = store.getBoardCards(boardId);
    const board = store.boards.find(b => b.id === boardId);
    const data = JSON.stringify({ board, cards }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (board?.name || 'board') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpenId(null);
  };

  const handleDelete = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(boardId);
  };

  const confirmDelete = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteBoard(boardId);
    if (boardId === activeBoardId) {
      const remaining = store.boards.filter(b => b.id !== boardId);
      if (remaining.length > 0) onSelectBoard(remaining[0].id);
    }
    setMenuOpenId(null);
    setConfirmDeleteId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  // Close menus on outside click
  useEffect(() => {
    if (!menuOpenId && !userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.board-menu-container')) {
        setMenuOpenId(null);
        setConfirmDeleteId(null);
      }
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId, userMenuOpen]);

  return (
    <div className="w-[252px] flex flex-col shrink-0 z-20 relative" style={{ background: 'hsl(240, 25%, 6%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="absolute top-0 right-0 bottom-0 w-px" style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.1), rgba(16,185,129,0.05) 50%, transparent)' }} />

      {/* Logo */}
      <div className="px-[18px] pt-[18px]">
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="THREADLINE" className="w-7 h-7 rounded-lg" style={{ objectFit: 'cover', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }} />
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
          const isMenuOpen = menuOpenId === board.id;

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
                /* Inline edit mode */
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
                /* Normal mode */
                <>
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: 'hsl(260, 20%, 92%)' }}
                    onDoubleClick={(e) => startEdit(board.id, board.name, e)}
                    title="Двойной клик — переименовать"
                  >
                    {board.name}
                  </span>

                  {board.isPinned && (
                    <Pin className="w-[9px] h-[9px] shrink-0 opacity-60" style={{ color: '#A855F7' }} />
                  )}

                  {/* Three-dot menu button */}
                  <div className="relative board-menu-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="opacity-0 group-hover/board:opacity-100 w-[18px] h-[18px] flex items-center justify-center rounded-[4px] shrink-0 transition-all"
                      style={{ color: 'hsl(255,8%,40%)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : board.id);
                        setConfirmDeleteId(null);
                      }}
                      title="Меню"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.color = '#A855F7'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsl(255,8%,40%)'; }}
                    >
                      <MoreHorizontal className="w-[11px] h-[11px]" />
                    </button>

                    {/* Dropdown menu — opens BELOW the button to avoid clipping */}
                    {isMenuOpen && (
                      <div
                        className="absolute top-full right-0 mt-1 z-50 min-w-[170px] rounded-[9px] py-1"
                        style={{
                          background: 'hsl(240, 25%, 9%)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {confirmDeleteId === board.id ? (
                          /* Delete confirmation */
                          <div className="px-3 py-2">
                            <div className="text-[11px] font-medium mb-2" style={{ color: 'hsl(260,20%,85%)' }}>Удалить борд?</div>
                            <div className="text-[10px] mb-3" style={{ color: 'hsl(255,8%,45%)' }}>Все карточки будут удалены</div>
                            <div className="flex gap-1.5">
                              <button
                                className="flex-1 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer"
                                style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                onMouseDown={(e) => confirmDelete(board.id, e)}
                              >
                                Удалить
                              </button>
                              <button
                                className="flex-1 py-1.5 rounded-[6px] text-[11px] cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'hsl(255,8%,62%)', border: '1px solid rgba(255,255,255,0.07)' }}
                                onMouseDown={cancelDelete}
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <MenuBtn icon={<Pencil className="w-[11px] h-[11px]" />} label="Переименовать" onClick={(e) => startEdit(board.id, board.name, e)} />
                            <MenuBtn
                              icon={board.isPinned ? <PinOff className="w-[11px] h-[11px]" /> : <Pin className="w-[11px] h-[11px]" />}
                              label={board.isPinned ? 'Открепить' : 'Закрепить'}
                              onClick={(e) => togglePin(board.id, board.isPinned, e)}
                            />
                            <MenuBtn icon={<Share2 className="w-[11px] h-[11px]" />} label="Скопировать ссылку" onClick={shareBoard} />
                            <MenuBtn icon={<Download className="w-[11px] h-[11px]" />} label="Экспорт JSON" onClick={(e) => exportBoard(board.id, e)} />
                            <div className="h-px mx-2 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <MenuBtn icon={<Trash2 className="w-[11px] h-[11px]" />} label="Удалить" onClick={(e) => handleDelete(board.id, e)} danger />
                          </>
                        )}
                      </div>
                    )}
                  </div>

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

      {/* User section */}
      <div className="relative user-menu-container" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full px-3.5 py-2.5 flex items-center gap-[9px] cursor-pointer transition-all text-left"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(240, 20%, 10%)'; }}
          onMouseLeave={(e) => { if (!userMenuOpen) e.currentTarget.style.background = ''; }}
          style={{ background: userMenuOpen ? 'hsl(240, 20%, 10%)' : undefined }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={(user?.display_name || 'User')} className="w-7 h-7 rounded-[7px] shrink-0 object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #A855F7, #10B981)', boxShadow: '0 0 10px rgba(168,85,247,0.2)' }}>
              {(user?.display_name || 'User').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] font-semibold truncate" style={{ color: 'hsl(260, 20%, 92%)' }}>{user?.display_name || 'User'}</div>
            <div className="text-[9.5px] truncate" style={{ color: 'hsl(255,8%,40%)' }}>{user?.email || 'user@threadline.io'}</div>
          </div>
          <ChevronUp className={"w-3 h-3 shrink-0 transition-transform " + (userMenuOpen ? '' : 'rotate-180')} style={{ color: 'hsl(255,8%,40%)' }} />
        </button>

        {/* User dropdown */}
        {userMenuOpen && (
          <div
            className="absolute bottom-full left-[7px] right-[7px] mb-1 z-50 rounded-[9px] py-1"
            style={{
              background: 'hsl(240, 25%, 9%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <MenuBtn
              icon={<Settings className="w-[11px] h-[11px]" />}
              label="Настройки"
              onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
            />
            <div className="h-px mx-2 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <MenuBtn
              icon={<LogOut className="w-[11px] h-[11px]" />}
              label="Выйти"
              danger
              onClick={handleLogout}
            />
          </div>
        )}
      </div>

      <CreateBoardDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={onSelectBoard} />
    </div>
  );
}

function MenuBtn({ icon, label, onClick, danger }: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-[7px] text-[11.5px] cursor-pointer transition-all text-left"
      style={{ color: danger ? '#EF4444' : 'hsl(255,8%,70%)', background: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      onMouseDown={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
