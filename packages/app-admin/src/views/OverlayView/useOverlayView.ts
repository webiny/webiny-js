import { useEffect, useState } from "react";
import { css } from "emotion";

const noScroll = css({
    overflow: "hidden",
    height: "100vh"
});

export type UseOverlayView = ReturnType<typeof useOverlayView>;

export function useOverlayView() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isVisible) {
            document.body.classList.add(noScroll);
        } else {
            document.body.classList.remove(noScroll);
        }
    }, [isVisible]);

    useEffect(() => {
        return () => {
            document.body.classList.remove(noScroll);
        };
    });

    return { isVisible, setIsVisible };
}
