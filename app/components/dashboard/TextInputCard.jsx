import Icon from "../Icon";

export default function TextInputCard({
  value,
  onChange,
  onExample,
  onClear,
  maxLength = 1000000,
  tokenBalance,
  className = ""
}) {
  return (
    <div id="text-input-card" className={`glass-card rounded-2xl p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Icon name="pen-to-square" className="mr-3 text-blue-400" />
          Text Input
        </h2>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition text-sm"
            onClick={onExample}
          >
            <Icon name="file-lines" className="mr-2" />
            Example
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-sm"
            onClick={onClear}
          >
            <Icon name="trash" className="mr-2" />
            Clear
          </button>
        </div>
      </div>
      <textarea
        id="text-input"
        className="w-full flex-1 min-h-[180px] sm:min-h-[210px] lg:min-h-[250px] bg-gray-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
        placeholder={`Enter your text here... (up to ${maxLength.toLocaleString()} characters)`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
      />
      <div className="flex items-center justify-between mt-4 shrink-0">
        <div className="text-gray-400 text-sm">
          <Icon name="circle-info" className="mr-2" />
          Supports multiple languages and formats
        </div>
        <div className="flex items-center gap-4">
          {typeof tokenBalance === "number" ? (
            <div className="glass-card px-3 py-2 rounded-lg text-xs text-gray-300">
              Tokens: <span className="text-white font-semibold">{tokenBalance.toLocaleString()}</span>
            </div>
          ) : null}
          <div className="glass-card px-4 py-2 rounded-lg">
            <span className="text-blue-400 font-mono text-lg font-bold">
              {value.length.toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm ml-2">/ {maxLength.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
