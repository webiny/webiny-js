import type { FileItem } from "~/types.js";

export type ActionFormData = Partial<Omit<FileItem, "id">>;
