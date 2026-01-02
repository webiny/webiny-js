import { useEffect, useRef } from "react";

export default function ReloadIfInactive({ timeoutMinutes = 60 }) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const TIMEOUT_MS = timeoutMinutes * 60 * 1000;

        const resetTimer = () => {
            // Clear existing timers
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            // Set reload timer
            timerRef.current = setTimeout(() => {
                window.location.reload();
            }, TIMEOUT_MS);
        };

        // Activity events to monitor
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
            "wheel"
        ];

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer, true);
            });
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [timeoutMinutes]);

    // This component doesn't render anything
    return null;
}
