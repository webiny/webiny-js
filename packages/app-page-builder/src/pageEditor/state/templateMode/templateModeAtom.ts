import { atom } from "recoil";

export type TemplateModeAtomType = boolean;
export const templateModeAtom = atom<TemplateModeAtomType>({
    key: "isTemplateMode",
    default: false
});
