import { useCallback } from "react";
import { atom, useRecoilState } from "recoil";

export type PageSettingsState = boolean;

export const pageSettingsStateAtom = atom<PageSettingsState>({
    key: "pageSettingsStateAtom",
    default: false
});

export function usePageSettings() {
    const [isOpen, setOpen] = useRecoilState(pageSettingsStateAtom);

    const openSettings = useCallback(() => {
        setOpen(true);
    }, []);

    const closeSettings = useCallback(() => {
        setOpen(false);
    }, []);

    return { isOpen, openSettings, closeSettings };
}
