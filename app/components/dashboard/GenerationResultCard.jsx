import Icon from "../Icon";
import WaveformBars from "./WaveformBars";

export default function GenerationResultCard({
  onGenerate,
  isProcessing,
  showResult,
  progress,
  statusText,
  canDownload,
  onDownload,
  onPlay,
  isFetchingAudio,
  canPlay,
  isPlaying,
  canSeek,
  onSeek,
  audioProgress,
  timeCurrent,
  timeTotal,
  sizeLabel,
  bitrateLabel
}) {
  const progressValue = Math.min(Math.max(audioProgress * 100, 0), 100);
  return (
    <div id="generation-result-card" className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Icon name="waveform-lines" className="mr-3 text-purple-400" />
        Generation &amp; Result
      </h2>

      <button
        id="generate-btn"
        type="button"
        className="w-full py-5 sm:py-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg sm:text-xl font-bold btn-glow transition mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
        onClick={onGenerate}
        disabled={isProcessing}
      >
        <Icon name="play" className="mr-3" />
        Create Voiceover
      </button>

      <div id="processing-area" className={isProcessing ? "" : "hidden"}>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <div className="text-white text-lg">{statusText}</div>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="liquid-progress h-full rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div id="result-player" className={showResult ? "" : "hidden"}>
        <div className="bg-gray-900/50 rounded-xl p-5 sm:p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 mb-4">
            <button
              type="button"
              className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed self-start"
              onClick={onPlay}
              disabled={!canPlay || isFetchingAudio}
            >
              <Icon name={isPlaying ? "pause" : "play"} className="text-xl" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <WaveformBars
                  className="text-blue-400"
                  delays={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]}
                />
                <div className="flex-1 h-2 bg-gray-800 rounded-full relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${progressValue}%` }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(progressValue)}
                    onChange={(event) => onSeek(Number(event.target.value))}
                    disabled={!canSeek}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{timeCurrent}</span>
                <span>{timeTotal}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span>
                <Icon name="file-audio" className="mr-2" />
                {sizeLabel}
              </span>
              <span>
                <Icon name="clock" className="mr-2" />
                {timeTotal}
              </span>
              <span>
                <Icon name="signal" className="mr-2" />
                {bitrateLabel}
              </span>
            </div>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              onClick={onDownload}
              disabled={!canDownload || isFetchingAudio}
            >
              <Icon name="download" className="mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
