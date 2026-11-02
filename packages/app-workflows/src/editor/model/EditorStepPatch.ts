import type { EditorStep } from "~/editor/domain/types.js";

// What an edit may change: never the id and never the type (D91).
export type EditorStepPatch = Partial<Omit<EditorStep, "id" | "type">>;
