import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Icon from "../Icon";

export default function Header() {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const helpRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!isHelpOpen) return;
    const onClick = (event) => {
      if (!helpRef.current) return;
      if (!helpRef.current.contains(event.target)) {
        setIsHelpOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isHelpOpen]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onClick = (event) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isSettingsOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsSettingsOpen(false);
      router.replace("/login");
    } catch {
      setIsSettingsOpen(false);
    }
  };

  const openSettings = () => {
    setIsHelpOpen(false);
    setIsSettingsOpen((prev) => !prev);
  };

  const openHelp = () => {
    setIsSettingsOpen(false);
    setIsHelpOpen((prev) => !prev);
  };

  return (
    <header id="header" className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Icon name="microphone-lines" className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Professional Audio Workstation</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="relative w-full lg:w-auto" ref={settingsRef}>
            <button
              type="button"
              className="glass-card w-full lg:w-auto px-4 py-2 rounded-lg text-white hover:bg-white/10 transition"
              onClick={openSettings}
            >
              <Icon name="gear" className="mr-2" />
              Settings
            </button>
            {isSettingsOpen ? (
              <div className="absolute left-0 right-0 lg:left-auto lg:right-0 mt-3 w-full lg:w-56 rounded-xl p-2 text-sm text-gray-200 shadow-xl z-50 bg-slate-900 border border-slate-700">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition text-red-300"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
          <div className="relative w-full lg:w-auto" ref={helpRef}>
            <button
              type="button"
              className="glass-card w-full lg:w-auto px-4 py-2 rounded-lg text-white hover:bg-white/10 transition"
              onClick={openHelp}
            >
              <Icon name="circle-question" className="mr-2" />
              Help
            </button>
            {isHelpOpen ? (
              <div className="absolute left-0 right-0 lg:left-auto lg:right-0 mt-3 w-full lg:w-96 rounded-xl p-4 text-xs text-gray-200 shadow-xl z-50 bg-slate-900 border border-slate-700">
                <div className="text-white font-semibold mb-2">What You Can Configure</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-white font-medium mb-1">Voice &amp; Model</div>
                    <div>Pick a preset voice (voice_id) or enter a Custom Voice ID.</div>
                    <div>Choose a model_id (quality vs speed). Default is Eleven Multilingual v2.</div>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Split &amp; ZIP</div>
                    <div>Split Type:</div>
                    <div>Smart (auto), Sentences, Paragraphs, Lines (max_length).</div>
                    <div>Max Chunk Length: 100–1000 characters (used by Smart and max_length).</div>
                    <div>Enable ZIP: when on, output is a ZIP of MP3 chunks. ZIP can only be downloaded.</div>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Manual Pauses</div>
                    <div>Enable pauses between chunks to control pacing manually.</div>
                    <div>Duration: 0.1–30 seconds.</div>
                    <div>Frequency: every Nth chunk gets a pause (1–100). Last chunk never pauses.</div>
                  </div>
                  <div className="text-gray-400">Text length: 1–1,000,000 characters.</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
