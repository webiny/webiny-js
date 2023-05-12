import { atom } from "recoil";

export type BlockSettingsState = boolean;

export const blockSettingsStateAtom = atom<BlockSettingsState>({
    key: "blockSettingsStateAtom",
    default: false
});
