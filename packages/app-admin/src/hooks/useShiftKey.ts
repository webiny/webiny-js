import { useState, useEffect, useCallback, useRef } from "react";
import { isHotkey } from "is-hotkey";

export interface UseShiftKeyResult {
    pressed: boolean;
    isPressed: () => boolean;
}

export function useShiftKey(): UseShiftKeyResult {
    const [pressed, setPressed] = useState(false);
    const pressedRef = useRef(false);
    const onselectstartRef = useRef(document.onselectstart);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (isHotkey("shift", event)) {
            pressedRef.current = true;
            setPressed(true);
        }
    }, []);

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key === "Shift" && event.shiftKey === false) {
            pressedRef.current = false;
            setPressed(false);
        }
    }, []);

    const isPressed = useCallback(() => pressedRef.current, []);

    useEffect(() => {
        document.onselectstart = () => !pressed;

        return () => {
            document.onselectstart = onselectstartRef.current;
        };
    }, [pressed]);

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    return { pressed, isPressed };
}
