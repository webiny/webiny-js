import { FileItem } from "@webiny/app-admin/types";

export type ActionFormData = Partial<Omit<FileItem, "id">>;
