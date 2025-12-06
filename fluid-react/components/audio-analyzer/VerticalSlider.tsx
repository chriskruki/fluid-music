"use client";

import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Props for VerticalSlider component
 */
export interface VerticalSliderProps {
  /**
   * Label for the slider
   */
  label: string;
  /**
   * Current value
   */
  value: number[];
  /**
   * Callback when value changes
   */
  onValueChange: (value: number[]) => void;
  /**
   * Minimum value
   */
  min: number;
  /**
   * Maximum value
   */
  max: number;
  /**
   * Step size
   */
  step?: number;
  /**
   * Whether the slider is disabled
   */
  disabled?: boolean;
  /**
   * Format function for displaying the value
   */
  formatValue?: (value: number) => string;
  /**
   * Height of the slider
   */
  height?: string;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Vertical slider component
 */
export function VerticalSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 0.01,
  disabled = false,
  formatValue = (v) => v.toFixed(2),
  height = "200px",
  className,
}: VerticalSliderProps) {
  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <Label className="text-xs text-center whitespace-nowrap">{label}</Label>
      <div
        className="relative flex items-center justify-center"
        style={{ height, width: "60px" }}
      >
        <SliderPrimitive.Root
          value={value}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          orientation="vertical"
          className={cn(
            "relative flex touch-none select-none items-center",
            "h-full w-6"
          )}
        >
          <SliderPrimitive.Track className="relative h-full w-2 grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute w-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
      </div>
      <div className="text-xs text-muted-foreground text-center min-h-[20px] font-mono">
        {formatValue(value[0])}
      </div>
    </div>
  );
}

