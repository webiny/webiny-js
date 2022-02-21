import { useEffect, useState } from "react";
import { css } from "emotion";
import { OverlayView } from "../OverlayView";

const noScroll = css({
    overflow: "hidden",
    height: "100vh"
});

export interface UseOverlayView {
    isVisible: boolean;
    setIsVisible: (value: boolean) => void;
}

export const useOverlayView = (): UseOverlayView => {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        if (isVisible) {
            OverlayView.openedViews++;
            document.body.classList.add(noScroll);
        } else if (!OverlayView.openedViews) {
            document.body.classList.remove(noScroll);
        }
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (OverlayView.openedViews > 0) {
                OverlayView.openedViews--;
            }
            if (!OverlayView.openedViews) {
                document.body.classList.remove(noScroll);
            }
        };
    }, []);

    return { isVisible, setIsVisible };
};
