import type React from "react";
import { useEffect, useRef } from "react";

/** The props a picker spreads on the element that wraps the admin-ui picker. */
export interface PickerFocusRestoreProps {
    ref: React.RefObject<HTMLDivElement>;
    onFocusCapture(): void;
    onBlurCapture(event: React.FocusEvent<HTMLDivElement>): void;
}

/*
 * The pickers remount the admin-ui picker when a chosen item goes (see `usePickerRemountKey`),
 * which drops the keyboard focus. When the focus was inside the picker before the remount, this
 * puts it back on the picker's input, so a keyboard user who removed a chip can keep typing.
 */
export const usePickerFocusRestore = (remountKey: number): PickerFocusRestoreProps => {
    const ref = useRef<HTMLDivElement>(null);
    const hadFocus = useRef(false);
    const shownKey = useRef(remountKey);

    useEffect(() => {
        if (shownKey.current === remountKey) {
            return;
        }
        shownKey.current = remountKey;
        if (!hadFocus.current) {
            return;
        }
        ref.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
    }, [remountKey]);

    return {
        ref,
        onFocusCapture: () => {
            hadFocus.current = true;
        },
        onBlurCapture: event => {
            // Focus moving within the picker keeps it; a removed element fires no blur.
            const next = event.relatedTarget;
            hadFocus.current = next instanceof Node && !!ref.current?.contains(next);
        }
    };
};
