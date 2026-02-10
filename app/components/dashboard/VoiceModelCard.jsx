import Icon from "../Icon";
import WaveformBars from "./WaveformBars";
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
  return (
    <div id="voice-model-card" className="glass-card rounded-2xl p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Icon name="microphone" className="mr-2 text-blue-400" />
        Voice &amp; Model
      </h2>

      <div className="space-y-3 mb-4">
        {voices.map((voice) => {
          const isSelected = voice.id === selectedVoice;
          return (
            <button
              key={voice.id}
              type="button"
              className={`glass-card rounded-xl p-4 w-full text-left cursor-pointer hover:bg-white/10 transition ${
                isSelected ? "border-2 border-blue-500" : ""
              }`}
              onClick={() => onSelect(voice.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <WaveformBars className={voice.color} delays={voice.delays} />
                  <div>
                    <div className="text-white font-medium">{voice.name}</div>
                    <div className="text-xs text-gray-400">{voice.meta}</div>
                  </div>
                </div>
                {isSelected ? <Icon name="circle-check" className="text-blue-500" /> : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-white/10">
        <label className="text-sm text-gray-300 mb-2 block">Model</label>
        <div className="glass-card rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition">
          <select
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value)}
            className="w-full bg-transparent text-white focus:outline-none"
          >
            {models.map((model) => (
              <option key={model} value={model} className="text-gray-900">
                {model}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" className="text-gray-400 ml-2" />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 mt-4">
        <label className="text-sm text-gray-300 mb-2 block">Custom Voice ID</label>
        <input
          type="text"
          value={customVoiceId}
          onChange={(event) => onCustomChange(event.target.value)}
          placeholder="voice_1234"
          className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>
  );
}
