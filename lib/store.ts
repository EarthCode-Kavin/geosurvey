"use client";

/**
 * Tiny persistence layer: lab state is stored in localStorage so the
 * Report Generator can assemble everything the student did across modules.
 */

import { useEffect, useState } from "react";
import type { GroundLayer } from "./materials";

export interface SiteInfo {
  projectName: string;
  client: string;
  location: string;
  engineer: string;
  date: string;
  objective: string;
}

export interface GeophysicsLabState {
  layers: GroundLayer[];
  method: string;
  params: Record<string, number>;
}

export interface GeotechLabState {
  layers: GroundLayer[];
  waterTableDepth: number;
  footingWidth: number;
  footingDepth: number;
  loadPressure: number;
}

const PREFIX = "geosurvey-lab:";

export function loadState<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveState<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full / private mode — non-fatal */
  }
}

/**
 * useState twin that hydrates from localStorage after mount (SSR-safe)
 * and persists on every change.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadState<T>(key);
    if (stored !== null) setValue(stored);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated) saveState(key, value);
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
