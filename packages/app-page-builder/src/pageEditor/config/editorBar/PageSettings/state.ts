import { atom } from "recoil";

export type PageSettingsState = boolean;

export const pageSettingsStateAtom = atom<PageSettingsState>({
    key: "pageSettingsStateAtom",
    default: false
});
