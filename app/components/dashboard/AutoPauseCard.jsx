import { useState } from "react";
import Icon from "../Icon";

export default function AutoPauseCard({
  enabled,
  onToggle,
  duration,
  onDurationChange,
  frequency,
  onFrequencyChange
}) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = (checked) => {
    onToggle(checked);
    if (checked) {
      setIsOpen(true);
    }
  };

  return (
    <div id="auto-pause-card" className="glass-card rounded-2xl px-5 py-4 sm:px-6 sm:py-4">
      <button
        type="button"
        className="w-full flex items-center justify-between text-lg font-semibold text-white"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          <Icon name="circle-pause" className="mr-2 text-green-400" />
          Pauses
        </span>
        <Icon name="chevron-down" className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div id="auto-pause-content" className={`space-y-4 mt-4 ${isOpen ? "" : "hidden"}`}>
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Enable Pauses</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={(event) => handleToggle(event.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className={enabled ? "space-y-4" : "hidden"}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Duration (sec)</label>
              <span className="text-blue-400 font-mono text-sm">{duration}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="30"
              step="0.1"
              value={duration}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              onChange={(event) => onDurationChange(Number(event.target.value))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Frequency</label>
              <span className="text-purple-400 font-mono text-sm">{frequency}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={frequency}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              onChange={(event) => onFrequencyChange(Number(event.target.value))}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
