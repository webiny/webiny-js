import { useCallback } from "react";
import { atom, useRecoilState } from "recoil";

type BlocksBrowserState = boolean;

const stateAtom = atom<BlocksBrowserState>({
    key: "blocksBrowserStateAtom",
    default: false
});

export function useBlocksBrowser() {
    const [isOpen, setOpen] = useRecoilState(stateAtom);

    const openBrowser = useCallback(() => {
        setOpen(true);
    }, []);

    const closeBrowser = useCallback(() => {
        setOpen(false);
    }, []);

    return { isOpen, openBrowser, closeBrowser };
}
