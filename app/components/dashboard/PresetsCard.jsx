import { useState } from "react";
import Icon from "../Icon";

const presets = [
  {
    key: "audiobook",
    title: "Audiobook",
    titleClass: "text-xs leading-tight",
    icon: "book",
    tileClass: "from-orange-500/80 via-red-500/70 to-rose-500/70",
    ringClass: "ring-orange-300/70",
    splitType: "Paragraphs",
    maxCharacters: 1000,
    duration: 1.5,
    durationLabel: "1.5",
    frequency: 1
  },
  {
    key: "podcast",
    title: "Podcast",
    titleClass: "text-xs leading-tight",
    icon: "podcast",
    tileClass: "from-indigo-500/80 via-purple-500/70 to-fuchsia-500/70",
    ringClass: "ring-fuchsia-300/70",
    splitType: "Smart",
    maxCharacters: 1400,
    duration: 2.5,
    durationLabel: "2.5",
    frequency: 1
  },
  {
    key: "learning",
    title: "Learning",
    titleClass: "text-xs leading-tight",
    icon: "pen-to-square",
    tileClass: "from-emerald-500/80 via-teal-500/70 to-cyan-500/70",
    ringClass: "ring-emerald-300/70",
    splitType: "Sentences",
    maxCharacters: 350,
    duration: 6,
    durationLabel: "6.0",
    frequency: 1
  },
  {
    key: "news",
    title: "News",
    titleClass: "text-xs leading-tight",
    icon: "file-lines",
    tileClass: "from-sky-500/80 via-blue-500/70 to-indigo-500/70",
    ringClass: "ring-sky-300/70",
    splitType: "Smart",
    maxCharacters: 1000,
    duration: 0.7,
    durationLabel: "0.7",
    frequency: 2
  },
  {
    key: "meditation",
    title: "Meditation",
    titleClass: "text-xs leading-tight",
    icon: "spa",
    tileClass: "from-green-500/80 via-emerald-500/70 to-teal-500/70",
    ringClass: "ring-emerald-300/70",
    splitType: "Paragraphs",
    maxCharacters: 700,
    duration: 20,
    durationLabel: "20.0",
    frequency: 1
  },
  {
    key: "dialogue",
    title: "Dialogue",
    titleClass: "text-xs leading-tight",
    icon: "microphone-lines",
    tileClass: "from-amber-500/80 via-orange-500/70 to-red-500/70",
    ringClass: "ring-amber-300/70",
    splitType: "Lines",
    maxCharacters: 350,
    duration: 0.3,
    durationLabel: "0.30",
    frequency: 1
  },
  {
    key: "sleep-story",
    title: "Sleep Story",
    titleClass: "text-xs leading-tight",
    icon: "clock",
    tileClass: "from-violet-500/80 via-purple-500/70 to-indigo-500/70",
    ringClass: "ring-violet-300/70",
    splitType: "Paragraphs",
    maxCharacters: 950,
    duration: 3,
    durationLabel: "3.0",
    frequency: 1
  },
  {
    key: "how-to",
    title: "How-to",
    titleClass: "text-xs leading-tight",
    icon: "circle-check",
    tileClass: "from-cyan-500/80 via-blue-500/70 to-sky-500/70",
    ringClass: "ring-cyan-300/70",
    splitType: "Sentences",
    maxCharacters: 500,
    duration: 0.6,
    durationLabel: "0.6",
    frequency: 2
  }
];

const buildPresetLabel = (preset) =>
  `${preset.splitType} • ${preset.maxCharacters} • Duration ${preset.durationLabel} • Frequency ${preset.frequency}`;

export default function PresetsCard({ onApply, selectedKey }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      id="presets-card"
      className="glass-card rounded-2xl p-5 sm:p-6 mb-6 lg:mb-0 h-fit self-start"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between text-lg font-semibold text-white"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="flex items-center">
          <Icon name="repeat" className="mr-2 text-emerald-400" />
          Presets
        </span>
        <Icon
          name="chevron-down"
          className={`text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`mt-4 ${open ? "" : "hidden"}`}>
        <div className="grid grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                className={`group relative h-[68px] rounded-2xl border border-white/10 bg-gradient-to-br p-3 text-white transition ${preset.tileClass} ${
                  isSelected
                    ? `ring-2 ${preset.ringClass} shadow-[0_0_22px_rgba(255,255,255,0.18)]`
                    : "hover:brightness-110"
                }`}
                onClick={() => onApply?.(preset)}
              >
                <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                  <span className="text-lg text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                    <Icon name={preset.icon} />
                  </span>
                  <span
                    className={`font-semibold break-words max-w-full ${preset.titleClass}`}
                  >
                    {preset.title}
                  </span>
                </div>
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {buildPresetLabel(preset)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
