import { useState, useEffect, useCallback, useRef } from "react";
import isHotkey from "is-hotkey";

export function useShiftKey() {
    const [pressed, setPressed] = useState(false);
    const onselectstartRef = useRef(document.onselectstart);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (isHotkey("shift", event)) {
            setPressed(true);
        }
    }, []);

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key === "Shift" && event.shiftKey === false) {
            setPressed(false);
        }
    }, []);

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

    return pressed;
}
