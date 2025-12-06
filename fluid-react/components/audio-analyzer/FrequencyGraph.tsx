"use client";

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import type { FrequencyData } from "./AudioAnalyzer";

/**
 * Default frequency band definitions (in Hz)
 */
const DEFAULT_FREQ_BANDS = {
  LOW: { min: 20, max: 250 },
  MID: { min: 250, max: 4000 },
  HIGH: { min: 4000, max: 20000 },
} as const;

/**
 * Props for FrequencyGraph component
 */
export interface FrequencyGraphProps {
  /**
   * Current frequency data to display
   */
  frequencyData: FrequencyData | null;
  /**
   * Threshold values for each band
   */
  thresholds?: {
    low: number;
    mid: number;
    high: number;
  };
  /**
   * Frequency band ranges (optional, uses defaults if not provided)
   */
  frequencyRanges?: {
    low: { min: number; max: number };
    mid: { min: number; max: number };
    high: { min: number; max: number };
  };
}

/**
 * Component that displays a realtime graph of frequency spectrum
 */
export function FrequencyGraph({
  frequencyData,
  thresholds,
  frequencyRanges,
}: FrequencyGraphProps) {
  const freqBands = useMemo(
    () =>
      frequencyRanges || {
        low: DEFAULT_FREQ_BANDS.LOW,
        mid: DEFAULT_FREQ_BANDS.MID,
        high: DEFAULT_FREQ_BANDS.HIGH,
      },
    [frequencyRanges]
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Draw frequency spectrum on canvas
   */
  const drawSpectrum = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas || !frequencyData) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const { fullSpectrum, sampleRate, fftSize } = frequencyData;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Calculate frequency per bin
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / (fftSize / 2);

    // Draw frequency spectrum bars
    const barWidth = width / fullSpectrum.length;
    const maxBarHeight = height * 0.9;

    for (let i = 0; i < fullSpectrum.length; i++) {
      const frequency = i * binWidth;
      const value = fullSpectrum[i]; // Use raw value (0-255)

      // Determine color based on frequency band
      let color = "#666";
      if (frequency >= freqBands.low.min && frequency <= freqBands.low.max) {
        color = "#60a5fa"; // Blue for low
      } else if (
        frequency >= freqBands.mid.min &&
        frequency <= freqBands.mid.max
      ) {
        color = "#34d399"; // Green for mid
      } else if (
        frequency >= freqBands.high.min &&
        frequency <= freqBands.high.max
      ) {
        color = "#f87171"; // Red for high
      }

      // Normalize value for display (0-255 -> 0-1 for height calculation)
      const normalizedValue = value / 255.0;
      const barHeight = normalizedValue * maxBarHeight;

      ctx.fillStyle = color;
      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }

    // Draw threshold lines
    if (thresholds) {
      const drawThresholdLine = (
        freqMin: number,
        freqMax: number,
        threshold: number,
        color: string
      ): void => {
        const startBin = Math.floor(freqMin / binWidth);
        const endBin = Math.floor(freqMax / binWidth);
        // Threshold is already normalized (0-1), use directly
        const thresholdY = height - threshold * maxBarHeight;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startBin * barWidth, thresholdY);
        ctx.lineTo(endBin * barWidth, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawThresholdLine(
        freqBands.low.min,
        freqBands.low.max,
        thresholds.low,
        "#60a5fa"
      );
      drawThresholdLine(
        freqBands.mid.min,
        freqBands.mid.max,
        thresholds.mid,
        "#34d399"
      );
      drawThresholdLine(
        freqBands.high.min,
        freqBands.high.max,
        thresholds.high,
        "#f87171"
      );
    }

    // Draw band intensity bars on the right side
    const barX = width - 120;
    const barWidth2 = 30;
    const barSpacing = 40;

    // Low band
    // frequencyData.low/mid/high are normalized values (0-1) from calculateBandIntensity
    ctx.fillStyle = "#60a5fa";
    const lowBarHeight = frequencyData.low * maxBarHeight;
    ctx.fillRect(barX, height - lowBarHeight, barWidth2, lowBarHeight);
    if (thresholds) {
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const thresholdY = height - thresholds.low * maxBarHeight;
      ctx.moveTo(barX, thresholdY);
      ctx.lineTo(barX + barWidth2, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Mid band
    ctx.fillStyle = "#34d399";
    const midBarHeight = frequencyData.mid * maxBarHeight;
    ctx.fillRect(
      barX + barSpacing,
      height - midBarHeight,
      barWidth2,
      midBarHeight
    );
    if (thresholds) {
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const thresholdY = height - thresholds.mid * maxBarHeight;
      ctx.moveTo(barX + barSpacing, thresholdY);
      ctx.lineTo(barX + barSpacing + barWidth2, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // High band
    ctx.fillStyle = "#f87171";
    const highBarHeight = frequencyData.high * maxBarHeight;
    ctx.fillRect(
      barX + barSpacing * 2,
      height - highBarHeight,
      barWidth2,
      highBarHeight
    );
    if (thresholds) {
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const thresholdY = height - thresholds.high * maxBarHeight;
      ctx.moveTo(barX + barSpacing * 2, thresholdY);
      ctx.lineTo(barX + barSpacing * 2 + barWidth2, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw labels
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText("L", barX + 10, height - 5);
    ctx.fillText("M", barX + barSpacing + 10, height - 5);
    ctx.fillText("H", barX + barSpacing * 2 + 10, height - 5);
  }, [frequencyData, thresholds, freqBands]);

  /**
   * Animation loop
   */
  useEffect(() => {
    const animate = (): void => {
      drawSpectrum();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (frequencyData) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [frequencyData, drawSpectrum]);

  /**
   * Handle canvas resize
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeCanvas = (): void => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 300;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label>Frequency Spectrum</Label>
      <div className="rounded-md border border-input bg-background p-4 relative">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: "300px" }}
        />
        {!frequencyData && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
            Start analysis to see frequency spectrum
          </div>
        )}
      </div>
    </div>
  );
}
