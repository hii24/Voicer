import Icon from "../Icon";

function HistoryItem({ item, onRepeat }) {
  const ready = Boolean(item.fullText);

  return (
    <div className="glass-card rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition">
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <Icon name="waveform-lines" className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-white text-sm font-medium truncate">{item.title}</div>
          <div className="text-xs text-gray-400">{item.meta}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center transition ${
            ready ? "text-gray-400 hover:text-blue-400 hover:bg-white/10" : "text-gray-600"
          }`}
          disabled={!ready}
          onClick={() => ready && onRepeat(item)}
        >
          <Icon name="repeat" />
        </button>
      </div>
    </div>
  );
}

export default function HistorySection({ isOpen, onToggle, items, count, onRepeat }) {
  return (
    <div id="history-section" className="mt-8">
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          id="history-toggle"
          type="button"
          className="w-full p-4 flex items-center justify-between text-white hover:bg-white/5 transition"
          onClick={onToggle}
        >
          <div className="flex items-center space-x-3">
            <Icon name="clock-rotate-left" className="text-blue-400" />
            <h2 className="text-lg font-semibold">Generation History</h2>
            <span className="px-2 py-1 rounded-full bg-blue-600 text-xs">{count}</span>
          </div>
          <Icon name="chevron-down" className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <div id="history-drawer" className={`history-drawer bg-gray-900/30 ${isOpen ? "open" : ""}`}>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {items.length
              ? items.map((item) => (
                  <HistoryItem key={item.id} item={item} onRepeat={onRepeat} />
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}
