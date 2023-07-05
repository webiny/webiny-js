import { PbPageData } from "~/types";

export type UpdatedPage = Pick<
    PbPageData,
    "id" | "content" | "title" | "path" | "status" | "savedOn"
>;

export interface SaveRevisionActionArgsType {
    debounce?: boolean;
    onFinish?: (page?: UpdatedPage) => void;
}

export interface ToggleSaveRevisionStateActionArgsType {
    saving: boolean;
}
