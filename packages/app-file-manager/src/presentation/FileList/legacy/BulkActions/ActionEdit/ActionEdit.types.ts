// @ts-nocheck
import type { FileItem } from "~/domain/types.js";

export type ActionFormData = Partial<Omit<FileItem, "id">>;
