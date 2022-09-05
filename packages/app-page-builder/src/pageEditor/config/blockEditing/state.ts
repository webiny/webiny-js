import { atom } from "recoil";

export type BlocksBrowserState = boolean;

export const blocksBrowserStateAtom = atom<BlocksBrowserState>({
    key: "blocksBrowserStateAtom",
    default: false
});
