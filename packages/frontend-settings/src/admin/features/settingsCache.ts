import type { IFrontendSettings } from "~/shared/types.js";

export const CACHE_KEY = "FrontendSettings/Settings";

export const settingsCache = new Map<string, IFrontendSettings>();
