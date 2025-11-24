/**
 * React hook for fluid simulation
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { FluidSimulation } from "@/lib/fluid/FluidSimulation";
import type { FluidConfig, PatternType } from "@/types/fluid";

export function useFluidSimulation(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  config: FluidConfig
) {
  const simulationRef = useRef<FluidSimulation | null>(null);
  const initialConfigRef = useRef<FluidConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Capture initial config value (only on first render)
  if (initialConfigRef.current === null) {
    initialConfigRef.current = config;
  }

  // Initialize simulation (only when canvas is ready, not on config changes)
  useEffect(() => {
    if (!canvasRef.current) {
      return; // Canvas not ready yet
    }

    // Skip if already initialized
    if (simulationRef.current) {
      return;
    }

    // Ensure we have initial config
    if (!initialConfigRef.current) {
      initialConfigRef.current = config;
    }

    let mounted = true;
    setIsInitialized(false);
    setError(null);

    console.log("Initializing FluidSimulation...");

    // Use initial config from ref to avoid re-initialization on config changes
    FluidSimulation.create(canvasRef.current, initialConfigRef.current)
      .then((sim) => {
        if (!mounted) {
          sim.destroy();
          return;
        }

        console.log("FluidSimulation initialized successfully");
        simulationRef.current = sim;
        sim.start();
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error("FluidSimulation initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      mounted = false;
      if (simulationRef.current) {
        simulationRef.current.destroy();
        simulationRef.current = null;
      }
      setIsInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]); // Only depend on canvasRef - config changes handled separately via updateConfig

  // Update config when it changes
  useEffect(() => {
    if (simulationRef.current && isInitialized) {
      simulationRef.current.updateConfig(config);
    }
  }, [config, isInitialized]);

  // Handle pointer events
  const handlePointerDown = useCallback((id: number, x: number, y: number) => {
    simulationRef.current?.handlePointerDown(id, x, y);
  }, []);

  const handlePointerMove = useCallback((id: number, x: number, y: number) => {
    simulationRef.current?.handlePointerMove(id, x, y);
  }, []);

  const handlePointerUp = useCallback((id: number) => {
    simulationRef.current?.handlePointerUp(id);
  }, []);

  // Pattern methods
  const createPattern = useCallback((pattern: PatternType) => {
    simulationRef.current?.createPattern(pattern);
  }, []);

  const createRandomSplats = useCallback((count: number) => {
    simulationRef.current?.createRandomSplats(count);
  }, []);

  return {
    isInitialized,
    error,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    createPattern,
    createRandomSplats,
    simulation: simulationRef.current,
  };
}
