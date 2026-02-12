import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { models } from "../../data/models";

export default function VoiceModelCard({
  voices,
  selectedVoice,
  onSelect,
  customVoiceId,
  onCustomChange,
  selectedModel,
  onModelChange
}) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const voiceRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    if (!voiceOpen) return;
    const onClick = (event) => {
      if (!voiceRef.current) return;
      if (!voiceRef.current.contains(event.target)) {
        setVoiceOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setVoiceOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [voiceOpen]);

  useEffect(() => {
    if (!modelOpen) return;
    const onClick = (event) => {
      if (!modelRef.current) return;
      if (!modelRef.current.contains(event.target)) {
        setModelOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setModelOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [modelOpen]);

  const selectedPreset = voices.find((voice) => voice.id === selectedVoice);
  const showCustom = customVoiceId && !selectedPreset;
  const voiceLabel = showCustom
    ? `Custom: ${customVoiceId}`
    : selectedPreset
      ? `${selectedPreset.name} · ${selectedPreset.meta}`
      : "Select voice";
  const selectedModelLabel = models.find((model) => model.id === selectedModel)?.label || selectedModel;

  return (
    <div id="voice-model-card" className="glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Icon name="microphone" className="mr-2 text-blue-400" />
        Voice &amp; Model
      </h2>

      <div className="space-y-4">
        <div ref={voiceRef} className="relative">
          <label className="text-sm text-gray-300 mb-2 block">Voice</label>
          <button
            type="button"
            className="glass-card w-full rounded-lg px-4 py-3 flex items-center justify-between text-white hover:bg-white/10 transition"
            onClick={() => {
              setModelOpen(false);
              setVoiceOpen((value) => !value);
            }}
          >
            <span className="truncate">{voiceLabel}</span>
            <Icon name="chevron-down" className={`text-gray-400 ml-2 transition-transform ${voiceOpen ? "rotate-180" : ""}`} />
          </button>

          {voiceOpen ? (
            <div className="absolute left-0 right-0 mt-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50">
              <div className="p-3 border-b border-slate-800">
                <label className="text-xs text-gray-400 mb-2 block">Custom Voice ID</label>
                <input
                  type="text"
                  value={customVoiceId}
                  onChange={(event) => onCustomChange(event.target.value)}
                  placeholder="voice_1234"
                  className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="p-2 max-h-56 overflow-y-auto">
                {voices.map((voice) => {
                  const isActive = voice.id === selectedVoice;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/10"
                      }`}
                      onClick={() => {
                        onSelect(voice.id);
                        setVoiceOpen(false);
                      }}
                    >
                      {voice.name} · {voice.meta}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div ref={modelRef} className="relative">
          <label className="text-sm text-gray-300 mb-2 block">Model</label>
          <button
            type="button"
            className="glass-card w-full rounded-lg px-4 py-3 flex items-center justify-between text-white hover:bg-white/10 transition"
            onClick={() => {
              setVoiceOpen(false);
              setModelOpen((value) => !value);
            }}
          >
            <span className="truncate">{selectedModelLabel}</span>
            <Icon name="chevron-down" className={`text-gray-400 ml-2 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
          </button>

          {modelOpen ? (
            <div className="absolute left-0 right-0 mt-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50">
              <div className="p-2 max-h-56 overflow-y-auto">
                {models.map((model) => {
                  const isActive = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/10"
                      }`}
                      onClick={() => {
                        onModelChange(model.id);
                        setModelOpen(false);
                      }}
                    >
                      {model.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
