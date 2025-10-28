import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Draggable, { type DraggableEventHandler } from "react-draggable";
import type { ResizableProps } from "react-resizable";
import { Resizable } from "react-resizable";
import styled from "@emotion/styled";
import { useKeyHandler } from "~/hooks/index.js";

const PanelRoot = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100000;
    width: 0;
    height: 0;
`;

const ResizeHandle = styled.div`
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    padding: 0 3px 3px 0;
    background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=")
        no-repeat bottom right;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: se-resize;
`;

export interface FloatingPanelRenderProp {
    (params: { height: number; width: number }): React.ReactNode;
}

export interface FloatingPanelProps {
    shortcut: string;
    dragHandle: string;
    children: FloatingPanelRenderProp;
}

export const FloatingPanel = ({ dragHandle, shortcut, children }: FloatingPanelProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [size, setSize] = useState({ width: 700, height: 600 });
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler(shortcut, e => {
            e.preventDefault();
            setIsVisible(isVisible => !isVisible);
        });

        return () => removeKeyHandler(shortcut);
    }, [setIsVisible]);

    const onDragStop: DraggableEventHandler = (_, data) => {
        setPosition({ x: data.x, y: data.y });
    };

    const onResize: ResizableProps["onResize"] = (_, { size }) => {
        setSize({ width: size.width, height: size.height });
    };

    return createPortal(
        <>
            <PanelRoot>
                <Draggable handle={dragHandle} onStop={onDragStop} position={position}>
                    <Resizable
                        width={size.width}
                        height={size.height}
                        onResize={onResize}
                        handle={<ResizeHandle />}
                    >
                        <div
                            className={"bg-neutral-base relative border-sm border-accent-default"}
                            style={{
                                display: isVisible ? "block" : "none",
                                width: size.width + "px",
                                height: size.height + "px"
                            }}
                        >
                            <div className={"floating-panel"}>{children(size)}</div>
                        </div>
                    </Resizable>
                </Draggable>
            </PanelRoot>
        </>,
        document.body
    );
};
