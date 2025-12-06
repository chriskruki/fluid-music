"use client";

import {
  AudioAnalyzer,
  FrequencyHitLog,
  FrequencyGraph,
  type FrequencyHit,
  type FrequencyData,
} from "@/components/audio-analyzer";
import { useState, useCallback } from "react";

/**
 * Audio analysis page that displays frequency hits from microphone input
 */
export default function AudioPage() {
  const [hits, setHits] = useState<FrequencyHit[]>([]);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(
    null
  );
  const [thresholds, setThresholds] = useState({
    low: 0.3,
    mid: 0.3,
    high: 0.3,
  });
  const [frequencyRanges, setFrequencyRanges] = useState({
    low: { min: 20, max: 250 },
    mid: { min: 250, max: 4000 },
    high: { min: 4000, max: 20000 },
  });

  /**
   * Handle frequency hit events from AudioAnalyzer
   */
  const handleHit = useCallback((hit: FrequencyHit): void => {
    setHits((prev) => [hit, ...prev]);
  }, []);

  /**
   * Handle frequency data updates from AudioAnalyzer
   */
  const handleFrequencyData = useCallback((data: FrequencyData): void => {
    setFrequencyData(data);
  }, []);

  /**
   * Handle threshold changes from AudioAnalyzer
   */
  const handleThresholdChange = useCallback(
    (newThresholds: {
      low: number;
      mid: number;
      high: number;
    }): void => {
      setThresholds(newThresholds);
    },
    []
  );

  /**
   * Handle frequency range changes from AudioAnalyzer
   */
  const handleFrequencyRangesChange = useCallback(
    (newRanges: {
      low: { min: number; max: number };
      mid: { min: number; max: number };
      high: { min: number; max: number };
    }): void => {
      setFrequencyRanges(newRanges);
    },
    []
  );

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audio Frequency Analyzer</h1>
          <p className="text-muted-foreground">
            Analyze microphone input and detect frequency hits in low, mid, and
            high bands
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <AudioAnalyzer
            onHit={handleHit}
            onFrequencyData={handleFrequencyData}
            onThresholdChange={handleThresholdChange}
            onFrequencyRangesChange={handleFrequencyRangesChange}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <FrequencyGraph
            frequencyData={frequencyData}
            thresholds={thresholds}
            frequencyRanges={frequencyRanges}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <FrequencyHitLog hits={hits} />
        </div>
      </div>
    </div>
  );
}

