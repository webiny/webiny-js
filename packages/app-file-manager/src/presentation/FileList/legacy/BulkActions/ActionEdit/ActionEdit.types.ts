// @ts-nocheck
import type { FileItem } from "@webiny/app-admin/types.js";

export type ActionFormData = Partial<Omit<FileItem, "id">>;
