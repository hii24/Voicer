export default function WaveformBars({ className = "", delays = [] }) {
  return (
    <div className={`waveform-icon ${className}`}>
      {delays.map((delay, index) => (
        <div key={`${delay}-${index}`} className="waveform-bar" style={{ animationDelay: `${delay}s` }} />
      ))}
    </div>
  );
}
