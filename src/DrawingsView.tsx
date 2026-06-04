import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDrawingStore } from "./storage";
import type { DrawingSummary } from "./storage";

function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86400_000) return `${Math.floor(d / 3600_000)}h ago`;
  return `${Math.floor(d / 86400_000)}d ago`;
}

export function DrawingsView({ onOpen }: { onOpen: (id: string) => void }) {
  const { drawings, create, rename, remove } = useDrawingStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  const handleCreate = async () => {
    const id = await create();
    onOpen(id);
  };

  const startRename = (d: DrawingSummary) => {
    setRenamingId(d._id);
    setRenameVal(d.title);
  };

  const commitRename = async () => {
    if (renamingId && renameVal.trim()) {
      await rename(renamingId, renameVal.trim());
    }
    setRenamingId(null);
  };

  if (drawings === undefined) {
    return <div className="mono text-xs text-ink-4 py-12 text-center">loading drawings...</div>;
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <button
          onClick={handleCreate}
          className="aspect-[4/3] border-2 border-dashed border-rule hover:border-ink-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors group"
        >
          <Plus size={24} className="text-ink-4 group-hover:text-ink-2" />
          <span className="mono text-[10px] uppercase tracking-wider text-ink-4 group-hover:text-ink-2">
            New Drawing
          </span>
        </button>
        {drawings.map((d) => (
          <div
            key={d._id}
            className="aspect-[4/3] border border-rule hover:border-ink-3 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-colors group relative"
            onClick={() => onOpen(d._id)}
          >
            {d.thumbnail ? (
              <img src={d.thumbnail} alt="" className="flex-1 object-contain bg-white p-1" draggable={false} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-paper-warm">
                <Pencil size={20} className="text-ink-4" />
              </div>
            )}
            <div className="px-2 py-1.5 border-t border-rule-light flex items-center gap-1 min-w-0">
              {renamingId === d._id ? (
                <input
                  autoFocus
                  className="mono text-[11px] text-ink bg-transparent outline-none flex-1 min-w-0"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="mono text-[11px] text-ink truncate flex-1">{d.title}</span>
              )}
              <span className="mono text-[9px] text-ink-4 shrink-0">{relTime(d.updatedAt)}</span>
            </div>
            <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(d);
                }}
                className="p-1.5 bg-ink/80 text-paper hover:bg-ink rounded-full backdrop-blur-sm"
                title="Rename"
              >
                <Pencil size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(d._id);
                }}
                className="p-1.5 bg-ink/80 text-paper hover:bg-rust rounded-full backdrop-blur-sm"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {drawings.length === 0 && (
        <div className="text-center py-16">
          <p className="font-mono text-xl text-ink-3">No drawings yet</p>
          <p className="mono text-xs text-ink-4 mt-2">Click + to create your first drawing</p>
        </div>
      )}
    </div>
  );
}
