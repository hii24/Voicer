"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import TextInputCard from "./TextInputCard";
import GenerationResultCard from "./GenerationResultCard";
import VoiceModelCard from "./VoiceModelCard";
import SplitZipCard from "./SplitZipCard";
import AutoPauseCard from "./AutoPauseCard";
import HistorySection from "./HistorySection";
import ErrorModal from "./ErrorModal";
import { voices } from "../../data/voices";
import { models } from "../../data/models";
import { useTasks } from "../../hooks/useTasks";
import { useUserProfile } from "../../hooks/useUserProfile";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

const statuses = ["In Queue...", "Synthesizing...", "Processing...", "Finalizing..."];
const exampleText = "Nature has always been a source of inspiration and wonder.";
const statusMap = {
  queued: "In Queue...",
  pending: "In Queue...",
  processing: "Processing...",
  synthesizing: "Synthesizing...",
  finalizing: "Finalizing...",
  completed: "Completed",
  failed: "Failed"
};

export default function Dashboard({ user }) {
  const { tasks } = useTasks(user);
  const { profile, missing } = useUserProfile(user);
  const [textInput, setTextInput] = useState("");
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(false);
  const [duration, setDuration] = useState(0.5);
  const [frequency, setFrequency] = useState(1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(statuses[0]);
  const [selectedVoice, setSelectedVoice] = useState(voices[0]?.id || "");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [zipEnabled, setZipEnabled] = useState(false);
  const [splitType, setSplitType] = useState("Smart");
  const [maxCharacters, setMaxCharacters] = useState(1000);
  const [error, setError] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [maxTextLength, setMaxTextLength] = useState(1000000);
  const pollRef = useRef(null);
  const progressRef = useRef(null);
  const audioRef = useRef(null);
  const audioCacheRef = useRef(new Map());
  const audioSizeRef = useRef(0);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [audioMeta, setAudioMeta] = useState({
    current: 0,
    duration: 0,
    size: 0,
    bitrate: 0,
    type: ""
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioCacheRef.current.forEach((entry) => {
        if (entry?.url) {
          URL.revokeObjectURL(entry.url);
        }
      });
      setIsPlaying(false);
    };
  }, []);

  useEffect(() => {
    if (!missing) return;
    showError("Account record not found. Please contact admin.");
    signOut(auth);
  }, [missing]);

  useEffect(() => {
    if (error) {
      setErrorOpen(true);
    }
  }, [error]);

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data.maxTextLength === "number") {
          setMaxTextLength(data.maxTextLength);
        }
      } catch {
        return;
      }
    };

    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const parseErrorMessage = (value) => {
    if (!value) return "Unexpected error";
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parseErrorMessage(parsed);
      } catch {
        return value;
      }
    }
    if (Array.isArray(value)) {
      if (value.length && value[0]?.msg) return value[0].msg;
      return value.map((item) => parseErrorMessage(item)).join("\n");
    }
    if (typeof value === "object") {
      if (value.error) return parseErrorMessage(value.error);
      if (value.detail) return parseErrorMessage(value.detail);
      if (value.message) return parseErrorMessage(value.message);
    }
    return String(value);
  };

  const showError = (value) => {
    setError(parseErrorMessage(value));
  };

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const index = Math.min(Math.floor(progress / 25), statuses.length - 1);
    setStatusText(statuses[index]);
  }, [progress, isProcessing]);

  const historyItems = useMemo(() => {
    return tasks.map((task) => {
      const createdAt = task.createdAt?.toDate ? task.createdAt.toDate() : null;
      const dateLabel = createdAt ? createdAt.toLocaleString() : "Just now";
      const status = task.status || "queued";
      const textValue = task.text || "";
      return {
        id: task.id,
        title: task.text_preview || "Untitled",
        meta: dateLabel,
        createdAt: dateLabel,
        status,
        progress: typeof task.progress === "number" ? task.progress : null,
        voicerTaskId: task.voicer_task_id || "",
        splitOutput: Boolean(task.settings?.split_output),
        settings: task.settings || {},
        fullText: textValue,
        textLength: typeof task.text_length === "number" ? task.text_length : textValue.length,
        tokenCost: typeof task.token_cost === "number" ? task.token_cost : null
      };
    });
  }, [tasks]);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return tasks.find((task) => task.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  useEffect(() => {
    if (!activeTaskId) return;
    setAudioMeta({ current: 0, duration: 0, size: 0, bitrate: 0, type: "" });
  }, [activeTaskId]);

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
    if (voices.some((voice) => voice.id === voiceId)) {
      setCustomVoiceId("");
    }
  };

  const handleCustomVoice = (value) => {
    setCustomVoiceId(value);
    if (value) {
      setSelectedVoice(value);
    }
  };

  const handlePreset = (nextDuration, nextFrequency) => {
    setAutoPauseEnabled(true);
    setDuration(nextDuration);
    setFrequency(nextFrequency);
  };

  const applyTaskSettings = (item) => {
    if (!item) return;
    if (item.fullText) {
      setTextInput(item.fullText);
    }
    const settings = item.settings || {};
    const voiceId = settings.voice_id || voices[0]?.id || "";
    if (voiceId) {
      if (voices.some((voice) => voice.id === voiceId)) {
        setSelectedVoice(voiceId);
        setCustomVoiceId("");
      } else {
        setSelectedVoice(voiceId);
        setCustomVoiceId(voiceId);
      }
    }
    if (settings.model_id) {
      setSelectedModel(settings.model_id);
    }
    const splitTypeMap = {
      smart: "Smart",
      sentences: "Sentences",
      paragraphs: "Paragraphs",
      max_length: "Lines"
    };
    setSplitType(splitTypeMap[settings.split_type] || "Smart");
    setMaxCharacters(settings.max_chunk_length || 1000);
    setZipEnabled(Boolean(settings.split_output));
    setAutoPauseEnabled(Boolean(settings.auto_pause_enabled));
    setDuration(settings.auto_pause_duration ?? 0.5);
    setFrequency(settings.auto_pause_frequency ?? 1);
  };

  const tokenBalance = typeof profile?.tokenBalance === "number" ? profile.tokenBalance : null;
  const tokenCost = textInput.length;
  const hasEnoughTokens = tokenBalance === null ? true : tokenCost <= tokenBalance;

  const stopProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startProgress = () => {
    stopProgress();
    progressRef.current = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 5 : prev));
    }, 150);
  };

  const startPolling = async (taskId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tts/status?taskId=${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          showError(text || "Status check failed");
          return;
        }
        const data = await res.json();
        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }
        if (data.status) {
          setStatusText(statusMap[data.status] || data.status);
        }
        if (data.status === "completed") {
          stopPolling();
          stopProgress();
          setProgress(100);
          setIsProcessing(false);
          setShowResult(true);
        }
        if (data.status === "failed") {
          stopPolling();
          stopProgress();
          setIsProcessing(false);
          setShowResult(false);
          showError(data.error || "Generation failed");
        }
      } catch (err) {
        showError(err?.message || "Status check failed");
      }
    }, 3000);
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const whole = Math.floor(seconds);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGenerate = async () => {
    setError("");

    if (profile?.canGenerate === false) {
      showError("Generation access denied by admin.");
      return;
    }

    if (!textInput.trim()) {
      showError("Enter text to generate");
      return;
    }
    if (textInput.length > maxTextLength) {
      showError(`Text exceeds ${maxTextLength.toLocaleString()} characters`);
      return;
    }
    if (typeof tokenBalance === "number" && textInput.length > tokenBalance) {
      showError(
        `Not enough tokens. Need ${textInput.length.toLocaleString()}, available ${tokenBalance.toLocaleString()}.`
      );
      return;
    }

    setIsProcessing(true);
    setShowResult(false);
    setProgress(0);
    setStatusText(statuses[0]);

    startProgress();

    const splitTypeMap = {
      Smart: "smart",
      Sentences: "sentences",
      Paragraphs: "paragraphs",
      Lines: "max_length"
    };

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textInput,
          voice_id: selectedVoice,
          model_id: selectedModel,
          split_type: splitTypeMap[splitType] || "smart",
          max_chunk_length: Math.min(Math.max(maxCharacters, 100), 1000),
          split_output: zipEnabled,
          auto_pause_enabled: autoPauseEnabled,
          auto_pause_duration: autoPauseEnabled ? duration : undefined,
          auto_pause_frequency: autoPauseEnabled ? frequency : undefined
        })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(parseErrorMessage(text) || "Generation failed");
      }

      const data = await res.json();
      if (data?.taskId) {
        setActiveTaskId(data.taskId);
        startPolling(data.taskId);
      }
    } catch (err) {
      stopProgress();
      setIsProcessing(false);
      setShowResult(false);
      showError(err?.message || "Generation failed");
    }
  };

  const fetchAudio = async (item) => {
    if (!item || !item.voicerTaskId) return null;
    try {
      if (audioCacheRef.current.has(item.voicerTaskId)) {
        const cached = audioCacheRef.current.get(item.voicerTaskId);
        audioSizeRef.current = cached.size || 0;
        setAudioMeta((prev) => ({
          ...prev,
          size: cached.size || 0,
          type: cached.contentType || prev.type
        }));
        return cached;
      }
      const token = await user.getIdToken();
      const res = await fetch(`/api/tts/download?taskId=${item.voicerTaskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        showError(message || "Download failed");
        return null;
      }
      const contentType = res.headers.get("content-type") || "";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const entry = { url, contentType, size: blob.size };
      audioCacheRef.current.set(item.voicerTaskId, entry);
      audioSizeRef.current = blob.size;
      setAudioMeta((prev) => ({ ...prev, size: blob.size, type: contentType }));
      return entry;
    } catch (err) {
      showError(err?.message || "Download failed");
      return null;
    }
  };

  const primeAudio = (entry) => {
    if (!entry?.url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("timeupdate", () => {
        setAudioMeta((prev) => ({ ...prev, current: audioRef.current.currentTime || 0 }));
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        const duration = audioRef.current.duration || 0;
        const bitrate = duration ? Math.round((audioSizeRef.current * 8) / 1000 / duration) : 0;
        setAudioMeta((prev) => ({ ...prev, duration, bitrate }));
      });
    }
    if (audioRef.current.src !== entry.url) {
      audioRef.current.src = entry.url;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      setAudioMeta((prev) => ({ ...prev, current: 0 }));
    }
  };

  const pauseAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleDownload = async (item) => {
    if (!item) return;
    setIsFetchingAudio(true);
    const entry = await fetchAudio(item);
    setIsFetchingAudio(false);
    if (!entry?.url) return;
    const link = document.createElement("a");
    link.href = entry.url;
    const extension = entry.contentType?.includes("zip") ? "zip" : "mp3";
    link.download = `voice-${item.voicerTaskId || item.id}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePlay = async (item) => {
    if (!item) return;
    if (isPlaying && currentAudioId === item.voicerTaskId) {
      pauseAudio();
      return;
    }
    setIsFetchingAudio(true);
    const entry = await fetchAudio(item);
    setIsFetchingAudio(false);
    if (!entry?.url) return;
    if (entry.contentType?.includes("zip")) {
      showError("ZIP output can only be downloaded.");
      return;
    }
    setCurrentAudioId(item.voicerTaskId);
    primeAudio(entry);
    try {
      await audioRef.current.play();
    } catch (err) {
      showError(err?.message || "Playback failed");
    }
  };

  const handleSeek = (percent) => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    if (!duration || Number.isNaN(duration)) return;
    const nextTime = Math.max(0, Math.min(duration, (duration * percent) / 100));
    audioRef.current.currentTime = nextTime;
    setAudioMeta((prev) => ({ ...prev, current: nextTime }));
  };

  useEffect(() => {
    if (!activeTask || activeTask.status !== "completed") return;
    if (activeTask.settings?.split_output) return;
    if (!activeTask.voicer_task_id) return;
    fetchAudio({
      id: activeTask.id,
      voicerTaskId: activeTask.voicer_task_id,
      status: activeTask.status || ""
    }).then((entry) => {
      if (entry?.url && !entry.contentType?.includes("zip")) {
        primeAudio(entry);
      }
    });
  }, [activeTask]);

  const isZipTask = Boolean(activeTask?.settings?.split_output);
  const canDownload = Boolean(activeTask?.voicer_task_id && activeTask?.status === "completed");
  const canPlay = canDownload && !isZipTask;
  const isPlayingCurrent = isPlaying && currentAudioId === (activeTask?.voicer_task_id || "");
  const canSeek = canPlay && audioMeta.duration > 0 && !isFetchingAudio;
  const canGenerate = profile?.canGenerate !== false;
  const generateDisabled = !canGenerate || !hasEnoughTokens;
  const generateHint = !canGenerate
    ? "Generation access disabled by admin."
    : !hasEnoughTokens
      ? `Not enough tokens. Need ${tokenCost.toLocaleString()}, available ${tokenBalance.toLocaleString()}.`
      : "";

  return (
    <div id="main-dashboard" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pb-10 pt-6">
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div id="workspace-area" className="lg:col-span-8">
          <TextInputCard
            value={textInput}
            onChange={setTextInput}
            onExample={() => setTextInput(exampleText)}
            onClear={() => setTextInput("")}
            maxLength={maxTextLength}
            tokenBalance={tokenBalance}
          />
          <GenerationResultCard
            onGenerate={handleGenerate}
            isProcessing={isProcessing}
            showResult={showResult}
            progress={progress}
            statusText={statusText}
            generateDisabled={generateDisabled}
            generateHint={generateHint}
            canDownload={canDownload}
            canPlay={canPlay}
            onDownload={() =>
              activeTask &&
              handleDownload({
                id: activeTask.id,
                voicerTaskId: activeTask.voicer_task_id || "",
                status: activeTask.status || ""
              })
            }
            onPlay={() =>
              activeTask &&
              handlePlay({
                id: activeTask.id,
                voicerTaskId: activeTask.voicer_task_id || "",
                status: activeTask.status || ""
              })
            }
            isFetchingAudio={isFetchingAudio}
            isPlaying={isPlayingCurrent}
            audioProgress={audioMeta.duration ? audioMeta.current / audioMeta.duration : 0}
            canSeek={canSeek}
            onSeek={handleSeek}
            timeCurrent={formatTime(audioMeta.current)}
            timeTotal={formatTime(audioMeta.duration)}
            sizeLabel={audioMeta.size ? `${(audioMeta.size / (1024 * 1024)).toFixed(1)} MB` : "--"}
            bitrateLabel={audioMeta.bitrate ? `${audioMeta.bitrate} kbps` : "--"}
          />
        </div>

        <div id="config-panel" className="lg:col-span-4">
          <VoiceModelCard
            voices={voices}
            selectedVoice={selectedVoice}
            onSelect={handleVoiceSelect}
            customVoiceId={customVoiceId}
            onCustomChange={handleCustomVoice}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <SplitZipCard
            zipEnabled={zipEnabled}
            onZipToggle={setZipEnabled}
            splitType={splitType}
            onSplitTypeChange={setSplitType}
            maxCharacters={maxCharacters}
            onMaxCharactersChange={setMaxCharacters}
          />
          <AutoPauseCard
            enabled={autoPauseEnabled}
            onToggle={setAutoPauseEnabled}
            duration={duration}
            onDurationChange={setDuration}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            onPreset={handlePreset}
          />
        </div>
      </div>

      <HistorySection
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen((open) => !open)}
        items={historyItems}
        count={tasks.length}
        onRepeat={applyTaskSettings}
      />

      <ErrorModal
        open={errorOpen}
        title="Request Failed"
        message={error}
        onClose={() => {
          setError("");
          setErrorOpen(false);
        }}
      />
    </div>
  );
}
