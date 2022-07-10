import { atom } from "recoil";

export type PageSettingsState = boolean | undefined;

export const pageSettingsStateAtom = atom<PageSettingsState>({
    key: "v2.pageSettingsStateAtom",
    default: false
});
