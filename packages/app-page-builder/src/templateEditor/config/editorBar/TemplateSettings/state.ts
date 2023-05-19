import { atom } from "recoil";

export type TemplateSettingsState = boolean;

export const templateSettingsStateAtom = atom<TemplateSettingsState>({
    key: "templateSettingsStateAtom",
    default: false
});
