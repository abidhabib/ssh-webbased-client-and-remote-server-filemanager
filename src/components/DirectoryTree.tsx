import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Star, HardDrive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TreeNodeProps {
  path: string;
  name: string;
  depth: number;
  sessionId: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function TreeNode({ path, name, depth, sessionId, currentPath, onNavigate }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<{ name: string; path: string; type: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isActive = currentPath === path;

  const listQuery = trpc.file.list.useQuery(
    { sessionId, path },
    { enabled: expanded && !loaded }
  );

  // Load children when expanded
  if (expanded && !loaded && listQuery.data?.success) {
    const dirs = listQuery.data.entries
      .filter((e: any) => e.type === "directory")
      .map((e: any) => ({ name: e.name, path: e.path, type: e.type }));
    setChildren(dirs);
    setLoaded(true);
  }

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!expanded) {
        setExpanded(true);
      } else {
        setExpanded(false);
      }
    },
    [expanded]
  );

  const handleClick = useCallback(() => {
    onNavigate(path);
  }, [path, onNavigate]);

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 py-1 pr-2 cursor-pointer group transition-colors ${
          isActive
            ? "bg-[#141414] border-l-2 border-[#60A5FA] text-white"
            : "text-[#A1A1AA] hover:text-white hover:bg-[#0F0F0F] border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          onClick={handleToggle}
          className="p-0.5 text-[#52525B] hover:text-[#A1A1AA] transition-colors flex-shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {isActive ? (
          <FolderOpen className="w-4 h-4 text-[#60A5FA] flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-[#52525B] group-hover:text-[#A1A1AA] flex-shrink-0" />
        )}
        <span className="text-xs font-mono-data truncate select-none">{name}</span>
      </div>

      {expanded && (
        <div>
          {loaded && children.length === 0 && (
            <div
              className="py-0.5 pl-4 text-xs text-[#52525B] font-mono-data"
              style={{ paddingLeft: `${24 + depth * 16}px` }}
            >
              (empty)
            </div>
          )}
          {children.map((child) => (
            <TreeNode
              key={child.path}
              path={child.path}
              name={child.name}
              depth={depth + 1}
              sessionId={sessionId}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DirectoryTree() {
  const { sessionId, currentPath, navigateTo, favorites } = useFileManagerStore();

  const rootQuery = trpc.file.list.useQuery(
    { sessionId: sessionId || "", path: "/" },
    { enabled: !!sessionId }
  );

  const rootFolders = rootQuery.data?.success
    ? rootQuery.data.entries.filter((e: any) => e.type === "directory")
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {/* Server Root */}
        <div
          onClick={() => navigateTo("/")}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
            currentPath === "/"
              ? "bg-[#141414] border-l-2 border-[#60A5FA] text-white"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#0F0F0F] border-l-2 border-transparent"
          }`}
        >
          <HardDrive className="w-4 h-4 text-[#52525B]" />
          <span className="text-xs font-mono-data font-medium">Server Root</span>
        </div>

        {/* Favorites Section */}
        <div className="mt-3">
          <div className="px-3 py-1.5 text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3 h-3" />
            Favorites
          </div>
          {favorites.length === 0 && (
            <div className="px-3 py-1 text-xs text-[#52525B] font-mono-data italic">
              No favorites yet
            </div>
          )}
          {favorites.map((fav) => (
            <div
              key={fav}
              onClick={() => navigateTo(fav)}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                currentPath === fav
                  ? "bg-[#141414] border-l-2 border-[#60A5FA] text-white"
                  : "text-[#A1A1AA] hover:text-white hover:bg-[#0F0F0F] border-l-2 border-transparent"
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-[#FACC15]" />
              <span className="text-xs font-mono-data truncate">
                {fav === "/" ? "~" : fav.split("/").pop()}
              </span>
            </div>
          ))}
        </div>

        {/* Directory Tree */}
        <div className="mt-3">
          <div className="px-3 py-1.5 text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
            <Folder className="w-3 h-3" />
            Directories
          </div>
          {rootQuery.isLoading && (
            <div className="px-3 py-2 text-xs text-[#52525B] font-mono-data animate-pulse">
              Loading...
            </div>
          )}
          {rootFolders.map((folder: any) => (
            <TreeNode
              key={folder.path}
              path={folder.path}
              name={folder.name}
              depth={0}
              sessionId={sessionId || ""}
              currentPath={currentPath}
              onNavigate={navigateTo}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
