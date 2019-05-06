import React, { useCallback, useRef, useEffect } from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { Elevation } from "webiny-ui/Elevation";
import { getLinkRange, TYPE } from "./utils";

const Tooltip = styled("span")({
    display: "flex",
    flexDirection: "row",
    position: "fixed",
    top: 20,
    left: 0,
    zIndex: 1,
    width: "auto",
    maxWidth: 520,
    "> span:not(:first-child)": {
        marginLeft: 10
    }
});

const tooltipInner = css({
    padding: "5px 10px",
    borderRadius: 2,
    fontSize: "0.8rem",
    a: {
        cursor: "pointer"
    }
});

const compressLink = href => {
    const start = href.substr(0, 24);
    const end = href.substr(24).substr(-24);

    return [start, "...", end].join("");
};

const getSelectionRect = () => {
    const native = window.getSelection();
    if (native.type === "None") {
        return { top: 0, left: 0, width: 0, height: 0 };
    }

    const range = native.getRangeAt(0);
    return range.getBoundingClientRect();
};

const displayNone = { display: "none" };

const LinkTooltip = ({ editor, onChange, activatePlugin }) => {
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

    const activateLink = useCallback(() => activatePlugin("cms-slate-menu-item-link"));
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

    return (
        <Tooltip innerRef={menuRef} style={displayNone}>
            <Elevation className={tooltipInner} z={1}>
                <span>
                    Link:{" "}
                    <a href={href} target={"_blank"}>
                        {href.length > 50 ? compressLink(href) : href}
                    </a>
                </span>{" "}
                | <a onClick={activateLink}>Change</a> | <a onClick={removeLink}>Remove</a>
            </Elevation>
        </Tooltip>
    );
};

export default LinkTooltip;
