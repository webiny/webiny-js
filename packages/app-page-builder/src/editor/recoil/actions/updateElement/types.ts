import { PbElement } from "@webiny/app-page-builder/types";

export type UpdateElementActionArgsType = {
    element: PbElement;
    merge?: boolean;
    history?: boolean;
};
