import { atom } from "recoil";
import { CmsModel } from "@webiny/app-headless-cms/types";

export interface SourceModel {
    data?: CmsModel;
}

export const sourceModelAtom = atom<SourceModel>({
    key: "sourceModelAtom",
    default: {}
});
