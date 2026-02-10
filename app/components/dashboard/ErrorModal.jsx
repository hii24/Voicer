import Icon from "../Icon";

export default function ErrorModal({ open, title = "Something went wrong", message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Icon name="circle-info" className="text-red-400" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-white transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4 text-sm text-gray-300 whitespace-pre-wrap">{message}</div>
        <div className="p-4 pt-0 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
