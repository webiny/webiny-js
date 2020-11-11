import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export type UpdatePageRevisionActionArgsType = {
    page: Omit<PageAtomType, "content">;
    onFinish?: () => void;
};
