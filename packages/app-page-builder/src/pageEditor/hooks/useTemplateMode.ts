import { atom, useRecoilState } from "recoil";

export type TemplateModeAtomType = boolean;
export const templateModeAtom = atom<TemplateModeAtomType>({
    key: "isTemplateMode",
    default: false
});

export function useTemplateMode() {
    return useRecoilState(templateModeAtom);
}
