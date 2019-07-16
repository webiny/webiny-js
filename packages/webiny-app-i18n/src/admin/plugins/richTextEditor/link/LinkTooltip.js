import React, { useCallback, useRef, useEffect } from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { getLinkRange, TYPE } from "./utils";
import { Elevation } from "webiny-ui/Elevation";

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

const LinkTooltip = ({ editor, onChange, activatePlugin }) => {
    const menuRef = useRef(null);
    const menu = menuRef.current;
    const link = editor.value.inlines.find(inline => inline.type === "link");
    const { selection } = editor.value;

    useEffect(() => {
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
            const menuRect = menu.getBoundingClientRect();
            let { top, left, height } = getSelectionRect();

            const menuRight = left + menuRect.width;
            const diff = editorRect.right - menuRight;

            // Position menu
            const position = { top: top + height, left: diff < 0 ? left + diff : left };

            menu.style.display = "flex";
            menu.style.top = position.top + "px";
            menu.style.left = position.left + "px";
        }
    });

    const activateLink = useCallback(() => activatePlugin("i18n-rich-editor-menu-item-link"));
    const removeLink = useCallback(() => {
        editor.change(change => {
            // Restore selection
            change.select(getLinkRange(change, change.value.selection)).unwrapInline(TYPE);
            onChange(change);
            menu.style.display = "none";
        });
    });

    const href = link ? link.data.get("href") : "";

    return (
        <Tooltip innerRef={menuRef} style={{ display: "none" }}>
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
