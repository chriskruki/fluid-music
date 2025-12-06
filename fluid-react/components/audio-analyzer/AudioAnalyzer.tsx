"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { VerticalSlider } from "./VerticalSlider";
import { VerticalRangeSlider } from "./VerticalRangeSlider";

/**
 * Frequency band intensity values (0-1)
 */
export interface FrequencyHit {
  low: number;
  mid: number;
  high: number;
  timestamp: number;
}

/**
 * Audio input device information
 */
interface AudioDevice {
  deviceId: string;
  label: string;
}

/**
 * Default frequency band definitions (in Hz)
 */
const DEFAULT_FREQ_BANDS = {
  LOW: { min: 20, max: 250 },
  MID: { min: 250, max: 4000 },
  HIGH: { min: 4000, max: 20000 },
} as const;

/**
 * Props for AudioAnalyzer component
 */
export interface FrequencyData {
  low: number;
  mid: number;
  high: number;
  fullSpectrum: Uint8Array;
  sampleRate: number;
  fftSize: number;
}

export interface AudioAnalyzerProps {
  /**
   * Callback function called when a frequency hit is detected
   */
  onHit?: (hit: FrequencyHit) => void;
  /**
   * Callback function called each frame with current frequency data
   */
  onFrequencyData?: (data: FrequencyData) => void;
  /**
   * Callback function called when thresholds change
   */
  onThresholdChange?: (thresholds: {
    low: number;
    mid: number;
    high: number;
  }) => void;
  /**
   * Callback function called when frequency ranges change
   */
  onFrequencyRangesChange?: (ranges: {
    low: { min: number; max: number };
    mid: { min: number; max: number };
    high: { min: number; max: number };
  }) => void;
  /**
   * Whether to automatically start analyzing on mount
   */
  autoStart?: boolean;
  /**
   * Threshold for detecting hits (0-1, default: 0.3)
   * @deprecated Use lowThreshold, midThreshold, highThreshold instead
   */
  hitThreshold?: number;
  /**
   * Minimum time between hits in milliseconds (default: 100)
   */
  minHitInterval?: number;
}

/**
 * AudioAnalyzer component that captures microphone input and performs FFT analysis
 * to detect intensity in low, mid, and high frequency bands.
 *
 * Based on butterchurn and ChromeAudioVisualizerExtension patterns for frequency analysis.
 */
export function AudioAnalyzer({
  onHit,
  onFrequencyData,
  onThresholdChange,
  onFrequencyRangesChange,
  autoStart = false,
  hitThreshold = 0.3,
  minHitInterval = 100,
}: AudioAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [hits, setHits] = useState<FrequencyHit[]>([]);
  const [error, setError] = useState<string>("");

  // Frequency band ranges (Hz)
  const [lowFreqMin, setLowFreqMin] = useState<number>(
    DEFAULT_FREQ_BANDS.LOW.min
  );
  const [lowFreqMax, setLowFreqMax] = useState<number>(
    DEFAULT_FREQ_BANDS.LOW.max
  );
  const [midFreqMin, setMidFreqMin] = useState<number>(
    DEFAULT_FREQ_BANDS.MID.min
  );
  const [midFreqMax, setMidFreqMax] = useState<number>(
    DEFAULT_FREQ_BANDS.MID.max
  );
  const [highFreqMin, setHighFreqMin] = useState<number>(
    DEFAULT_FREQ_BANDS.HIGH.min
  );
  const [highFreqMax, setHighFreqMax] = useState<number>(
    DEFAULT_FREQ_BANDS.HIGH.max
  );

  // Threshold values (0-1)
  const [lowThreshold, setLowThreshold] = useState(hitThreshold);
  const [midThreshold, setMidThreshold] = useState(hitThreshold);
  const [highThreshold, setHighThreshold] = useState(hitThreshold);

  // Input gain (0-10, default 1.0)
  const [inputGain, setInputGain] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastHitTimeRef = useRef<number>(0);
  const hasInitializedThresholdsRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(true);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Get available audio input devices
   */
  const getAudioDevices = useCallback(async (): Promise<void> => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceInfos
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        }));

      setDevices(audioInputs);

      // Set default device if none selected
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      setError(`Failed to enumerate devices: ${(err as Error).message}`);
    }
  }, [selectedDeviceId]);

  /**
   * Calculate frequency bin index for a given frequency
   */
  const getFrequencyBin = useCallback(
    (frequency: number, sampleRate: number, fftSize: number): number => {
      const nyquist = sampleRate / 2;
      return Math.floor((frequency / nyquist) * (fftSize / 2));
    },
    []
  );

  /**
   * Calculate intensity for a frequency band
   */
  const calculateBandIntensity = useCallback(
    (
      dataArray: Uint8Array,
      minFreq: number,
      maxFreq: number,
      sampleRate: number,
      fftSize: number
    ): number => {
      const startBin = getFrequencyBin(minFreq, sampleRate, fftSize);
      const endBin = getFrequencyBin(maxFreq, sampleRate, fftSize);

      let sum = 0;
      let count = 0;

      for (let i = startBin; i <= endBin && i < dataArray.length; i++) {
        // Normalize to 0-1 range (Uint8Array values are 0-255)
        const normalized = dataArray[i] / 255.0;
        sum += normalized * normalized; // Use squared values for energy
        count++;
      }

      if (count === 0) return 0;

      // Return RMS (root mean square) intensity
      return Math.sqrt(sum / count);
    },
    [getFrequencyBin]
  );

  /**
   * Analyze audio data using FFT
   */
  const analyzeAudio = useCallback((): void => {
    if (
      !analyserRef.current ||
      !dataArrayRef.current ||
      !audioContextRef.current
    ) {
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const fftSize = analyser.fftSize;

    // Get frequency data
    // This will return fresh data each time, but smoothingTimeConstant affects
    // how quickly it responds to changes
    analyser.getByteFrequencyData(dataArray);

    // Calculate intensity for each frequency band using current frequency ranges
    const lowIntensity = calculateBandIntensity(
      dataArray,
      lowFreqMin,
      lowFreqMax,
      sampleRate,
      fftSize
    );

    const midIntensity = calculateBandIntensity(
      dataArray,
      midFreqMin,
      midFreqMax,
      sampleRate,
      fftSize
    );

    const highIntensity = calculateBandIntensity(
      dataArray,
      highFreqMin,
      highFreqMax,
      sampleRate,
      fftSize
    );

    // Call frequency data callback if provided
    if (onFrequencyData) {
      onFrequencyData({
        low: lowIntensity,
        mid: midIntensity,
        high: highIntensity,
        fullSpectrum: new Uint8Array(dataArray),
        sampleRate,
        fftSize,
      });
    }

    // Check if any band exceeds its threshold (hit detection)
    const now = Date.now();
    const lowHit = lowIntensity >= lowThreshold;
    const midHit = midIntensity >= midThreshold;
    const highHit = highIntensity >= highThreshold;

    if (
      (lowHit || midHit || highHit) &&
      now - lastHitTimeRef.current >= minHitInterval
    ) {
      lastHitTimeRef.current = now;

      const hit: FrequencyHit = {
        low: lowIntensity,
        mid: midIntensity,
        high: highIntensity,
        timestamp: now,
      };

      setHits((prev) => {
        const newHits = [hit, ...prev];
        // Keep only last 100 hits
        return newHits.slice(0, 100);
      });

      // Call callback if provided
      if (onHit) {
        onHit(hit);
      }
    }

    // Continue analysis loop - use appropriate method based on visibility
    if (isVisibleRef.current) {
      // Use requestAnimationFrame when tab is visible (smooth, synced with display)
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } else {
      // Use setInterval when tab is hidden (consistent timing, not throttled)
      intervalRef.current = window.setTimeout(analyzeAudio, 16); // ~60fps
    }
  }, [
    lowFreqMin,
    lowFreqMax,
    midFreqMin,
    midFreqMax,
    highFreqMin,
    highFreqMax,
    lowThreshold,
    midThreshold,
    highThreshold,
    minHitInterval,
    onHit,
    onFrequencyData,
    calculateBandIntensity,
  ]);

  /**
   * Start audio analysis
   */
  const startAnalysis = useCallback(async (): Promise<void> => {
    try {
      setError("");

      // Get audio constraints with device selection
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume audio context if suspended (handles browser autoplay policies)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Initialize audioMotion-analyzer for enhanced frequency analysis
      if (!audioMotionRef.current) {
        // Create a hidden container for audioMotion (we'll use its data, not visualization)
        const hiddenContainer = document.createElement("div");
        hiddenContainer.style.position = "absolute";
        hiddenContainer.style.visibility = "hidden";
        hiddenContainer.style.width = "1px";
        hiddenContainer.style.height = "1px";
        document.body.appendChild(hiddenContainer);

        audioMotionRef.current = new AudioMotionAnalyzer(hiddenContainer, {
          mode: 0, // Use discrete FFT frequencies
          fftSize: 2048,
          minFreq: 20,
          maxFreq: 20000,
          onCanvasDraw: (instance) => {
            // Use audioMotion's frequency data
            const bars = instance.getBars();

            if (bars && bars.length > 0 && audioContextRef.current) {
              // Calculate frequency band intensities using audioMotion's data
              const sampleRate = audioContextRef.current.sampleRate;
              const nyquist = sampleRate / 2;
              const binWidth = nyquist / (instance.fftSize / 2);

              // Calculate band intensities from audioMotion bars
              let lowSum = 0,
                lowCount = 0;
              let midSum = 0,
                midCount = 0;
              let highSum = 0,
                highCount = 0;

              bars.forEach((bar, index) => {
                const frequency = index * binWidth;
                // bar.value is a number (normalized 0-1)
                const value = typeof bar.value === "number" ? bar.value : 0;

                if (frequency >= lowFreqMin && frequency <= lowFreqMax) {
                  lowSum += value * value;
                  lowCount++;
                } else if (frequency >= midFreqMin && frequency <= midFreqMax) {
                  midSum += value * value;
                  midCount++;
                } else if (
                  frequency >= highFreqMin &&
                  frequency <= highFreqMax
                ) {
                  highSum += value * value;
                  highCount++;
                }
              });

              const lowIntensity =
                lowCount > 0 ? Math.sqrt(lowSum / lowCount) : 0;
              const midIntensity =
                midCount > 0 ? Math.sqrt(midSum / midCount) : 0;
              const highIntensity =
                highCount > 0 ? Math.sqrt(highSum / highCount) : 0;

              // Get full spectrum for visualization
              const fullSpectrum = new Uint8Array(bars.length);
              bars.forEach((bar, index) => {
                const value = typeof bar.value === "number" ? bar.value : 0;
                fullSpectrum[index] = Math.round(value * 255);
              });

              // Call frequency data callback
              if (onFrequencyData) {
                onFrequencyData({
                  low: lowIntensity,
                  mid: midIntensity,
                  high: highIntensity,
                  fullSpectrum,
                  sampleRate,
                  fftSize: instance.fftSize,
                });
              }

              // Hit detection
              const now = Date.now();
              const lowHit = lowIntensity >= lowThreshold;
              const midHit = midIntensity >= midThreshold;
              const highHit = highIntensity >= highThreshold;

              if (
                (lowHit || midHit || highHit) &&
                now - lastHitTimeRef.current >= minHitInterval
              ) {
                lastHitTimeRef.current = now;

                const hit: FrequencyHit = {
                  low: lowIntensity,
                  mid: midIntensity,
                  high: highIntensity,
                  timestamp: now,
                };

                setHits((prev) => {
                  const newHits = [hit, ...prev];
                  return newHits.slice(0, 100);
                });

                if (onHit) {
                  onHit(hit);
                }
              }
            }
          },
        });
      }

      // Also keep the original analyser for compatibility
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      // Create gain node for input volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = inputGain;
      gainNodeRef.current = gainNode;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Connect: source -> gain -> analyser (for fallback/backup)
      source.connect(gainNode);
      gainNode.connect(analyser);

      // Connect audioMotion to the gain node (after gain for input volume control)
      if (audioMotionRef.current) {
        audioMotionRef.current.connectInput(gainNode);
      }

      // Create data array for frequency data (fallback)
      const bufferLength = analyser.frequencyBinCount;
      const buffer = new ArrayBuffer(bufferLength);
      const dataArray = new Uint8Array(buffer);
      dataArrayRef.current = dataArray;

      // Initialize visibility state
      isVisibleRef.current = !document.hidden;

      setIsAnalyzing(true);

      // audioMotion handles its own animation loop via onCanvasDraw
      // We can still use analyzeAudio as fallback if needed
      if (!audioMotionRef.current) {
        analyzeAudio();
      }
    } catch (err) {
      setError(`Failed to start analysis: ${(err as Error).message}`);
      setIsAnalyzing(false);
    }
  }, [
    selectedDeviceId,
    inputGain,
    analyzeAudio,
    lowFreqMin,
    lowFreqMax,
    midFreqMin,
    midFreqMax,
    highFreqMin,
    highFreqMax,
    lowThreshold,
    midThreshold,
    highThreshold,
    minHitInterval,
    onHit,
    onFrequencyData,
  ]);

  /**
   * Update input gain when it changes
   */
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = inputGain;
    }
  }, [inputGain]);

  /**
   * Handle page visibility changes for background tab optimization
   */
  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    const handleVisibilityChange = async (): Promise<void> => {
      const isVisible = !document.hidden;
      isVisibleRef.current = isVisible;

      // Handle AudioContext state when tab becomes visible
      if (isVisible && audioContextRef.current) {
        // Resume AudioContext if suspended
        if (audioContextRef.current.state === "suspended") {
          try {
            await audioContextRef.current.resume();
          } catch (err) {
            console.warn("Failed to resume AudioContext:", err);
          }
        }
      }

      // Switch between requestAnimationFrame and setInterval
      if (isVisible) {
        // Tab is visible - switch to requestAnimationFrame
        if (intervalRef.current !== null) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
        // Restart with requestAnimationFrame
        if (analyserRef.current && dataArrayRef.current) {
          analyzeAudio();
        }
      } else {
        // Tab is hidden - switch to setInterval
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        // Restart with setInterval
        if (analyserRef.current && dataArrayRef.current) {
          analyzeAudio();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAnalyzing, analyzeAudio]);

  /**
   * Stop audio analysis
   */
  const stopAnalysis = useCallback((): void => {
    // Stop and destroy audioMotion analyzer
    if (audioMotionRef.current) {
      try {
        audioMotionRef.current.destroy();
      } catch (err) {
        console.warn("Error destroying audioMotion:", err);
      }
      audioMotionRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear interval if running
    if (intervalRef.current !== null) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear analyser smoothing before stopping to prevent stale data
    // This helps ensure fresh data when restarting
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = 0;
      // Clear the data array by zeroing it out
      if (dataArrayRef.current) {
        dataArrayRef.current.fill(0);
      }
    }

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsAnalyzing(false);
  }, []);

  /**
   * Load devices on mount
   */
  useEffect(() => {
    getAudioDevices();
  }, [getAudioDevices]);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (autoStart && !isAnalyzing && selectedDeviceId) {
      startAnalysis();
    }
  }, [autoStart, isAnalyzing, selectedDeviceId, startAnalysis]);

  /**
   * Notify parent of threshold changes (only after initial mount)
   */
  useEffect(() => {
    if (!hasInitializedThresholdsRef.current) {
      hasInitializedThresholdsRef.current = true;
      return;
    }

    if (onThresholdChange) {
      onThresholdChange({
        low: lowThreshold,
        mid: midThreshold,
        high: highThreshold,
      });
    }
  }, [lowThreshold, midThreshold, highThreshold, onThresholdChange]);

  /**
   * Notify parent of frequency range changes
   */
  useEffect(() => {
    if (onFrequencyRangesChange) {
      onFrequencyRangesChange({
        low: { min: lowFreqMin, max: lowFreqMax },
        mid: { min: midFreqMin, max: midFreqMax },
        high: { min: highFreqMin, max: highFreqMax },
      });
    }
  }, [
    lowFreqMin,
    lowFreqMax,
    midFreqMin,
    midFreqMax,
    highFreqMin,
    highFreqMax,
    onFrequencyRangesChange,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="device-select">Audio Input Device</Label>
        <select
          id="device-select"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={isAnalyzing}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {devices.length === 0 ? (
            <option value="">No devices available</option>
          ) : (
            devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
          disabled={!selectedDeviceId && devices.length > 0}
          variant={isAnalyzing ? "destructive" : "default"}
        >
          {isAnalyzing ? "Stop Analysis" : "Start Analysis"}
        </Button>
        <Button onClick={getAudioDevices} variant="outline" size="sm">
          Refresh Devices
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-500">
          Analyzing audio... Listening for frequency hits.
        </div>
      )}

      <div className="space-y-6 pt-4 border-t">
        {/* Input Gain Control */}
        <div className="space-y-2">
          <Label>Input Gain</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[inputGain]}
              onValueChange={(value) => setInputGain(value[0])}
              min={0}
              max={10}
              step={0.1}
              disabled={!isAnalyzing}
              className="flex-1"
            />
            <div className="text-sm font-mono w-16 text-right">
              {inputGain.toFixed(1)}x
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Boost microphone input volume. Increase if audio levels are too low.
          </p>
        </div>

        {/* Frequency Ranges and Hit Thresholds */}
        <div className="space-y-2">
          <Label>Frequency Ranges & Hit Thresholds</Label>
          <div className="flex gap-8 justify-center items-end p-4 bg-muted/30 rounded-lg">
            {/* Low Band */}
            <div className="flex flex-col items-center gap-4">
              <Label className="text-blue-400 text-xs font-semibold">Low</Label>
              <div className="flex gap-4 items-end">
                <VerticalRangeSlider
                  label="Freq Range (Hz)"
                  value={[lowFreqMin, lowFreqMax]}
                  onValueChange={(value) => {
                    setLowFreqMin(value[0]);
                    setLowFreqMax(value[1]);
                  }}
                  min={20}
                  max={1000}
                  step={1}
                  disabled={!isAnalyzing}
                  formatValue={(v) => `${Math.round(v)}`}
                  height="150px"
                />
                <VerticalSlider
                  label="Threshold"
                  value={[lowThreshold]}
                  onValueChange={(value) => setLowThreshold(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!isAnalyzing}
                  height="150px"
                />
              </div>
            </div>

            {/* Mid Band */}
            <div className="flex flex-col items-center gap-4">
              <Label className="text-green-400 text-xs font-semibold">
                Mid
              </Label>
              <div className="flex gap-4 items-end">
                <VerticalRangeSlider
                  label="Freq Range (Hz)"
                  value={[midFreqMin, midFreqMax]}
                  onValueChange={(value) => {
                    setMidFreqMin(value[0]);
                    setMidFreqMax(value[1]);
                  }}
                  min={100}
                  max={5000}
                  step={1}
                  disabled={!isAnalyzing}
                  formatValue={(v) => `${Math.round(v)}`}
                  height="150px"
                />
                <VerticalSlider
                  label="Threshold"
                  value={[midThreshold]}
                  onValueChange={(value) => setMidThreshold(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!isAnalyzing}
                  height="150px"
                />
              </div>
            </div>

            {/* High Band */}
            <div className="flex flex-col items-center gap-4">
              <Label className="text-red-400 text-xs font-semibold">High</Label>
              <div className="flex gap-4 items-end">
                <VerticalRangeSlider
                  label="Freq Range (Hz)"
                  value={[highFreqMin, highFreqMax]}
                  onValueChange={(value) => {
                    setHighFreqMin(value[0]);
                    setHighFreqMax(value[1]);
                  }}
                  min={2000}
                  max={20000}
                  step={10}
                  disabled={!isAnalyzing}
                  formatValue={(v) => `${Math.round(v)}`}
                  height="150px"
                />
                <VerticalSlider
                  label="Threshold"
                  value={[highThreshold]}
                  onValueChange={(value) => setHighThreshold(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!isAnalyzing}
                  height="150px"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Hits trigger when intensity exceeds the threshold for each frequency
            band.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display frequency hits in a log format
 */
export function FrequencyHitLog({ hits }: { hits: FrequencyHit[] }) {
  return (
    <div className="space-y-2">
      <Label>Frequency Hits Log</Label>
      <div className="rounded-md border border-input bg-background p-4 h-96 overflow-y-auto font-mono text-sm">
        {hits.length === 0 ? (
          <div className="text-muted-foreground">No hits detected yet...</div>
        ) : (
          hits.map((hit, index) => {
            const date = new Date(hit.timestamp);
            const timeStr = date.toLocaleTimeString();
            return (
              <div
                key={index}
                className="mb-2 pb-2 border-b border-border last:border-0"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {timeStr}
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-400">Low:</span>{" "}
                    <span className="font-semibold">{hit.low.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-green-400">Mid:</span>{" "}
                    <span className="font-semibold">{hit.mid.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-red-400">High:</span>{" "}
                    <span className="font-semibold">{hit.high.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
