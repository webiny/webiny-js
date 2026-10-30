import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { useHotkeys } from "~/hooks/useHotkeys.js";

interface DrawerProps {
    open: boolean;
    shortcut: string;
    onEsc: () => void;
}

/**
 * Mimics the drawers that register an "esc" shortcut: mounted closed, enabled only while open.
 */
const Drawer = ({ open, shortcut, onEsc }: DrawerProps) => {
    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            [shortcut]: onEsc
        }
    });

    return null;
};

/**
 * The registry behind `useHotkeys` is module state shared by every caller, so each test claims
 * its own shortcut to stay independent of the others.
 */
describe("useHotkeys", () => {
    it("should release the shortcut when unmounted while open", () => {
        const onEsc = vi.fn();
        const props = { shortcut: "ctrl+1", onEsc };

        // Mounted closed, then opened - this is what a drawer does.
        const view = render(<Drawer open={false} {...props} />);
        view.rerender(<Drawer open={true} {...props} />);

        // Unmount while still open, as happens when navigating away from an open drawer.
        view.unmount();

        // A new instance must be able to claim the same shortcut again.
        expect(() => render(<Drawer open={true} {...props} />)).not.toThrow();
    });

    it("should release the shortcut when unmounted while closed", () => {
        const onEsc = vi.fn();
        const props = { shortcut: "ctrl+2", onEsc };

        const view = render(<Drawer open={false} {...props} />);
        view.unmount();

        expect(() => render(<Drawer open={true} {...props} />)).not.toThrow();
    });

    it("should still throw when two mounted components claim the same shortcut", () => {
        const onEsc = vi.fn();
        const props = { shortcut: "ctrl+3", onEsc };

        const first = render(<Drawer open={true} {...props} />);

        expect(() => render(<Drawer open={true} {...props} />)).toThrow(
            'Shortcut "ctrl+3" already registered on zIndex 55.'
        );

        first.unmount();
    });
});
