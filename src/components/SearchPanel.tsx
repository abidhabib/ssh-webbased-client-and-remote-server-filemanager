import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  Search,
  X,
  File,
  Folder,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function SearchPanel() {
  const { sessionId, currentPath, navigateTo, setShowSearch, addLog } = useFileManagerStore();
  const [query, setQuery] = useState("");
  const [maxDepth, setMaxDepth] = useState(5);
  const [results, setResults] = useState<
    { name: string; path: string; type: string; size: number; modified: Date }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchQuery = trpc.search.search.useQuery(
    { sessionId: sessionId || "", path: currentPath, query, maxDepth },
    { enabled: false }
  );

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !sessionId) return;

    setIsSearching(true);
    try {
      const result = await searchQuery.refetch();

      if (result.data?.success) {
        setResults(result.data.results as any);
        addLog({
          message: `Search "${query}" found ${result.data.results.length} results`,
          type: "info",
        });
      } else if (result.error) {
        toast.error("Search failed: " + result.error.message);
      }
    } catch (err: any) {
      toast.error("Search error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  }, [query, sessionId, currentPath, maxDepth, searchQuery, addLog]);

  const handleResultClick = useCallback(
    (path: string, type: string) => {
      if (type === "directory") {
        navigateTo(path);
      } else {
        // Navigate to parent directory and select file
        const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
        navigateTo(parentPath);
      }
      setShowSearch(false);
    },
    [navigateTo, setShowSearch]
  );

  return (
    <div
      className="w-[600px] max-h-[500px] bg-[#141414] border border-[#27272A] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-[#52525B]" />
          <span className="text-xs font-mono-data text-[#A1A1AA] uppercase tracking-wider">
            Search Files
          </span>
          <button
            onClick={() => setShowSearch(false)}
            className="ml-auto p-1 text-[#52525B] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename..."
            className="flex-1 bg-[#0A0A0A] border-[#27272A] text-white font-mono-data text-sm h-8 focus:border-[#60A5FA]"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <select
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            className="bg-[#0A0A0A] border border-[#27272A] text-white font-mono-data text-xs h-8 px-2 focus:border-[#60A5FA] outline-none"
          >
            <option value={1}>Depth: 1</option>
            <option value={3}>Depth: 3</option>
            <option value={5}>Depth: 5</option>
            <option value={10}>Depth: 10</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-3 py-1.5 bg-[#60A5FA] hover:bg-[#3B82F6] text-white text-xs font-mono-data transition-colors disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 spinner" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1 max-h-[350px]">
        {results.length === 0 && !isSearching && (
          <div className="p-4 text-center text-xs text-[#52525B] font-mono-data">
            {query ? "No results found" : "Enter a search query to find files"}
          </div>
        )}

        {isSearching && results.length === 0 && (
          <div className="p-4 text-center">
            <Loader2 className="w-5 h-5 spinner text-[#52525B] mx-auto" />
            <span className="text-xs text-[#52525B] font-mono-data mt-2 block">
              Searching...
            </span>
          </div>
        )}

        <div className="py-1">
          {results.map((result, index) => (
            <button
              key={`${result.path}-${index}`}
              onClick={() => handleResultClick(result.path, result.type)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#0A0A0A] transition-colors text-left"
            >
              {result.type === "directory" ? (
                <Folder className="w-4 h-4 text-[#60A5FA] flex-shrink-0" />
              ) : (
                <File className="w-4 h-4 text-[#A1A1AA] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-mono-data truncate">
                  {result.name}
                </div>
                <div className="text-[10px] text-[#52525B] font-mono-data truncate">
                  {result.path}
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-[#52525B] flex-shrink-0" />
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {results.length > 0 && (
        <div className="p-2 border-t border-[#27272A] text-[10px] font-mono-data text-[#52525B] text-center">
          {results.length} result{results.length !== 1 ? "s" : ""} found
        </div>
      )}
    </div>
  );
}
