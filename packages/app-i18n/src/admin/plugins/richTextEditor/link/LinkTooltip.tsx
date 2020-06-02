import React, { useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Elevation } from "@webiny/ui/Elevation";
import { useFocused, useSlate } from "slate-react";
import { Editor, Transforms } from "slate";

const Tooltip = styled("span")({
    display: "flex",
    flexDirection: "row",
    position: "fixed",
    top: 20,
    left: 0,
    zIndex: 100,
    width: "auto",
    maxWidth: 520,
    "> span:not(:first-of-type)": {
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

export const Portal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

export const LinkTooltip = ({ activatePlugin }) => {
    const editor = useSlate();
    const focused = useFocused();
    const menuRef = useRef(null);
    const menu = menuRef.current;

    const [inline] = Editor.nodes(editor, {
        match: n => n.type === "link"
    }) as any[];

    const link = !!inline ? inline[0] : null;

    useEffect(() => {
        if ((!link && focused) || !focused) {
            if (menu) {
                menu.style.display = "none";
            }
            return;
        }

        // Calculate position
        if (menu) {
            menu.style.display = "flex";
            const editorRect = menu.parentNode.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            const { top, left, height } = getSelectionRect();

            const menuRight = left + menuRect.width;
            const diff = editorRect.right - menuRight;

            // Position menu
            const position = { top: top + height, left: diff < 0 ? left + diff - 30 : left };

            menu.style.top = position.top + "px";
            menu.style.left = position.left + "px";
        }
    });

    const activateLink = useCallback(() => {
        activatePlugin("link");
    }, []);

    const removeLink = useCallback(() => {
        Transforms.unwrapNodes(editor, { match: n => n.type === "link" });
    }, []);

    const href = link ? link.href : "";

    return (
        <Portal>
            <Tooltip ref={menuRef} style={{ display: "none" }}>
                <Elevation className={tooltipInner} z={1}>
                    <span>
                        Link: {/* eslint-disable-next-line react/jsx-no-target-blank */}
                        <a href={href} target={"_blank"}>
                            {href.length > 50 ? compressLink(href) : href}
                        </a>
                    </span>{" "}
                    | <a onMouseDown={activateLink}>Change</a> |{" "}
                    <a onMouseDown={removeLink}>Remove</a>
                </Elevation>
            </Tooltip>
        </Portal>
    );
};
