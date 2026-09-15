import { useMemo } from "react";
import { useHotkeys, type CommandPalettePresenter } from "@webiny/app-admin";
import { PALETTE_HOTKEY_ZINDEX } from "./constants.js";

interface PaletteHotkeysParams {
    presenter: CommandPalettePresenter.Interface;
    /* Not `presenter.close`: closing also resets the mode, which is the palette's business. */
    close: () => void;
}

/**
 * The palette's global keys: the ones that work while it is closed, or while focus is not in the
 * input. Keys that only mean something while typing stay on the input's `onKeyDown`.
 *
 * Reads the view model during render, so a reactive component calling this still re-renders when
 * the palette opens, a detail view appears, or AI mode is entered.
 */
export const usePaletteHotkeys = ({ presenter, close }: PaletteHotkeysParams) => {
    const { isOpen, activeCommand, aiModeActive } = presenter.vm;

    /*
     * mod+k cycles closed -> commands -> AI -> closed, so the same key that opens the palette also
     * reaches the assistant without the user having to know about the space shortcut. Closing from AI
     * mode keeps mod+k a way OUT of the palette, which is what it does everywhere else.
     * Backspace backs out of a detail view; command shortcuts run directly.
     */
    const keys = useMemo(
        () => ({
            "mod+k": (e: KeyboardEvent) => {
                e.preventDefault();

                if (!isOpen) {
                    presenter.open();
                    return;
                }

                /*
                 * A detail view renders in place of the command list, so switching to AI mode from
                 * there would put the user in a mode they cannot see. Back out to the list instead.
                 */
                if (activeCommand) {
                    presenter.cancelCommand();
                    return;
                }

                if (!aiModeActive) {
                    presenter.enterAiMode();
                    return;
                }

                close();
            },
            backspace: (e: KeyboardEvent) => {
                if (e.target instanceof HTMLInputElement) {
                    return;
                }
                e.preventDefault();
                presenter.cancelCommand();
            },
            ...presenter.shortcutKeys
        }),
        [presenter, presenter.shortcutKeys, isOpen, activeCommand, aiModeActive, close]
    );

    useHotkeys({ zIndex: PALETTE_HOTKEY_ZINDEX, keys });
};
