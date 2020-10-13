import React, { SyntheticEvent, useEffect, useRef, useState } from "react";

type ResizerProps = {
    axis: "x" | "y";
    onResizeStart?: () => void;
    onResizeStop?: () => void;
    onResize(position: number): void;
    children(params: {
        isResizing: boolean;
        onMouseDown(e: SyntheticEvent): void;
    }): React.ReactElement;
};

type OnMouseMoveType = (ev: MouseEvent) => void;
type OnMouseUpType = (ev: MouseEvent) => void;

const addEventListeners = (onMouseMove: OnMouseMoveType, onMouseUp: OnMouseUpType) => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};
const removeEventListeners = (onMouseMove: OnMouseMoveType, onMouseUp: OnMouseUpType) => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
};

const Resizer = ({
    axis,
    onResizeStart = () => {
        return;
    },
    onResizeStop = () => {
        return;
    },
    onResize,
    children
}: ResizerProps) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const startPosition = useRef(0);

    // attaching events on drag start
    // detaching on drag end
    // on the first run event listeners can be removed, nothing wrong about it
    useEffect(() => {
        if (isDragging) {
            addEventListeners(onMouseMove, onMouseUp);
        } else {
            removeEventListeners(onMouseMove, onMouseUp);
        }

        return () => {
            removeEventListeners(onMouseMove, onMouseUp);
        };
    }, [isDragging]);

    const getMousePosition = (ev: MouseEvent): number => {
        return axis === "x" ? ev.pageX : ev.pageY;
    };

    const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging) {
            return;
        }
        const mousePosition = getMousePosition(ev);
        onResize(startPosition.current - mousePosition);
        startPosition.current = mousePosition;
    };

    const onMouseUp = () => {
        if (!isDragging) {
            return;
        }
        setIsDragging(false);
        onResizeStop();
    };

    const onMouseDown = (ev: SyntheticEvent<any, MouseEvent>) => {
        ev.preventDefault();
        ev.stopPropagation();
        const targetEvent =
            ev.nativeEvent?.pageX !== undefined ? ev.nativeEvent : ((ev as unknown) as MouseEvent);
        startPosition.current = getMousePosition(targetEvent);

        setIsDragging(true);
        onResizeStart();
    };

    return children({
        isResizing: isDragging,
        onMouseDown
    });
};

export default Resizer;
