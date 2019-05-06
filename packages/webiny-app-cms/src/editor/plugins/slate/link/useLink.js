import { useEffect, useCallback, useRef } from "react";
import { getLinkRange, TYPE } from "./utils";

const getSelectionRect = () => {
    const native = window.getSelection();
    if (native.type === "None") {
        return { top: 0, left: 0, width: 0, height: 0 };
    }

    const range = native.getRangeAt(0);
    return range.getBoundingClientRect();
};

export default function useLink({ editor, onChange, activatePlugin }) {
    const menuRef = useRef(null);
    const link = editor.value.inlines.find(inline => inline.type === "link");
    const { selection } = editor.value;

    useEffect(() => {
        const menu = menuRef.current;

        if (!link && selection.isFocused) {
            menu.style.display = "none";
            return;
        }

        if (!selection.isFocused) {
            // Don't reposition the tooltip;
            // When we attempt to click the button, editor focus is lost.
            return;
        }

        // Calculate position
        if (menu) {
            const editorRect = menu.parentNode.getBoundingClientRect();
            let { top, left, height } = getSelectionRect();

            // Cursor position is calculated in relation to `window`
            const cursorLeft = left - editorRect.left;
            const position = { top: top - editorRect.top + height, left: cursorLeft };

            menu.style.display = "flex";
            menu.style.top = position.top + "px";
            menu.style.left = `0px`;

            // Menu position is calculated in relation to parent element
            const menuRect = menu.getBoundingClientRect();
            if (menuRect.width + cursorLeft > editorRect.width) {
                menu.style.left = `${editorRect.width - menuRect.width - 20}px`;
            } else {
                menu.style.left = `${cursorLeft}px`;
            }
        }
    });

    function activateLink() {
        activatePlugin("cms-slate-menu-item-link");
    }

    const removeLink = useCallback(() => {
        const menu = menuRef.current;
        editor.change(change => {
            // Restore selection
            change.select(getLinkRange(change, change.value.selection)).unwrapInline(TYPE);
            onChange(change);
            menu.style.display = "none";
        });
    });

    const href = link ? link.data.get("href") : "";

    return {
        href,
        menuRef,
        activateLink,
        removeLink
    };
}
