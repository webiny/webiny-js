import { PbElement } from "@webiny/app-page-builder/types";

export type DropElementActionArgsType = {
    source: PbElement;
    target: {
        id: string;
        type: string;
        position: number;
    };
};
