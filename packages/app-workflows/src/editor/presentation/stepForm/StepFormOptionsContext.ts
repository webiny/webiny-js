import { createContext } from "react";
import type { StepFormOptions } from "./StepFormOptions.js";

export const StepFormOptionsContext = createContext<StepFormOptions | null>(null);
