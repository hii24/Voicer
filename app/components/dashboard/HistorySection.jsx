"use client";

import { useMemo, useState } from "react";
import Icon from "../Icon";

function formatTooltip(item) {
  const settings = item.settings || {};
  const lines = [
    `Task ID: ${item.id || "-"}`,
    `Voicer Task ID: ${item.voicerTaskId || "-"}`,
    `Created At: ${item.createdAt || "-"}`,
    `Status: ${item.status || "-"}`,
    `Progress: ${typeof item.progress === "number" ? item.progress : "-"}`,
    `Token Cost: ${typeof item.tokenCost === "number" ? item.tokenCost.toLocaleString() : "-"}`,
    `Voice ID: ${settings.voice_id || "-"}`,
    `Model ID: ${settings.model_id || "-"}`,
    `Split Type: ${settings.split_type || "-"}`,
    `Max Chunk Length: ${settings.max_chunk_length || "-"}`,
    `Split Output (ZIP): ${settings.split_output ? "true" : "false"}`,
    `Pause Enabled: ${settings.auto_pause_enabled ? "true" : "false"}`,
    `Pause Duration: ${settings.auto_pause_duration ?? "-"}`,
    `Pause Frequency: ${settings.auto_pause_frequency ?? "-"}`
  ];

  const textValue = item.fullText || "";
  const textLength = typeof item.textLength === "number" ? item.textLength : textValue.length;
  lines.push(`Text Length: ${textLength.toLocaleString()}`);
  lines.push("Text:");
  lines.push(textValue || "-");

  return lines.join("\n");
}

function HistoryItem({ item, onRepeat, onHover, onLeave }) {
  const ready = Boolean(item.fullText);

  return (
    <div
      className="glass-card rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition"
      onMouseEnter={(event) => onHover(item, event)}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <Icon name="waveform-lines" className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">{item.title}</div>
          <div className="text-xs text-gray-400 truncate">{item.meta}</div>
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
  const [hoverInfo, setHoverInfo] = useState(null);
  const tooltipText = useMemo(() => {
    if (!hoverInfo?.item) return "";
    return formatTooltip(hoverInfo.item);
  }, [hoverInfo]);

  const handleHover = (item, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverInfo({ item, rect });
  };

  const handleLeave = () => {
    setHoverInfo(null);
  };

  const tooltipStyle = useMemo(() => {
    if (!hoverInfo?.rect || typeof window === "undefined") return null;
    const rect = hoverInfo.rect;
    const viewportWidth = window.innerWidth || 1200;
    const viewportHeight = window.innerHeight || 800;
    const width = Math.min(rect.width, 560);
    const left = Math.min(Math.max(16, rect.left), Math.max(16, viewportWidth - width - 16));
    const estimatedHeight = 260;
    const placeBelow = rect.bottom + estimatedHeight + 16 < viewportHeight;
    const top = placeBelow
      ? rect.bottom + 8
      : Math.max(16, rect.top - estimatedHeight - 8);
    return { left, top, width };
  }, [hoverInfo]);

  return (
    <div id="history-section" className="mt-8">
      <div className="glass-card rounded-2xl">
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
          <div
            className="p-4 space-y-2 max-h-96 overflow-y-auto"
            onScroll={() => setHoverInfo(null)}
          >
            {items.length
              ? items.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onRepeat={onRepeat}
                    onHover={handleHover}
                    onLeave={handleLeave}
                  />
                ))
              : null}
          </div>
        </div>
      </div>

      {hoverInfo && tooltipStyle ? (
        <div
          className="fixed z-50 rounded-xl bg-slate-900/95 border border-slate-700 p-3 text-xs text-gray-200 shadow-xl max-h-64 overflow-auto whitespace-pre-wrap"
          style={tooltipStyle}
          onMouseEnter={() => setHoverInfo(hoverInfo)}
          onMouseLeave={handleLeave}
        >
          {tooltipText}
        </div>
      ) : null}
    </div>
  );
}
