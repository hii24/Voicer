import { useState } from "react";
import Icon from "../Icon";

const splitTypes = ["Smart", "Sentences", "Paragraphs", "Lines"];

export default function SplitZipCard({
  zipEnabled,
  onZipToggle,
  splitType,
  onSplitTypeChange,
  maxCharacters,
  onMaxCharactersChange
}) {
  const [open, setOpen] = useState(true);

  return (
    <div id="split-zip-card" className="glass-card rounded-2xl p-5 sm:p-6">
      <button
        type="button"
        className="w-full flex items-center justify-between text-lg font-semibold text-white"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="flex items-center">
          <Icon name="scissors" className="mr-2 text-purple-400" />
          Split &amp; ZIP
        </span>
        <Icon name="chevron-down" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`space-y-4 mt-4 ${open ? "" : "hidden"}`}>
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Enable ZIP</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={zipEnabled}
              onChange={(event) => onZipToggle(event.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Split Type</label>
          <div className="flex flex-wrap gap-2">
            {splitTypes.map((type) => {
              const isActive = splitType === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={
                    isActive
                      ? "px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium neon-glow"
                      : "px-3 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition"
                  }
                  onClick={() => onSplitTypeChange(type)}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Max Chunk Length</label>
          <input
            type="number"
            value={maxCharacters}
            onChange={(event) => onMaxCharactersChange(Number(event.target.value))}
            min={100}
            max={1600}
            className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>
    </div>
  );
}
