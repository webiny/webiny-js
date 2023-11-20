import { useState, useEffect, useCallback } from "react";
import isHotkey from "is-hotkey";

export function useModKey() {
    const [pressed, setPressed] = useState(false);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (isHotkey("Control", event) || isHotkey("Meta", event)) {
            setPressed(true);
        }
    }, []);

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key === "Control" && event.ctrlKey === false) {
            setPressed(false);
        }

        if (event.key === "Meta" && event.metaKey === false) {
            setPressed(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    console.log("pressed", pressed);

    return pressed;
}
