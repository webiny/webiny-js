import React, { useCallback, useEffect, useState } from "react";
import noop from "lodash/noop.js";
import type { ExitHandler } from "react-transition-group/Transition";
import type { overlayHeaderVariants } from "./components/index.js";
import { OverlayBackdrop, OverlayContent, OverlayHeader, OverlayRoot } from "./components/index.js";
import { Portal, type VariantProps } from "@webiny/admin-ui";

const noScrollBodyClassNames = ["overflow-hidden", "h-screen"];

export interface OverlayLayoutProps extends VariantProps<typeof overlayHeaderVariants> {
    barMiddle?: React.ReactNode;
    barLeft?: React.ReactNode;
    barRight?: React.ReactNode;
    children: React.ReactNode;
    onExited?: ExitHandler<HTMLElement>;
}

export const OverlayLayout: React.FC<OverlayLayoutProps> = ({
    barMiddle,
    barLeft,
    barRight,
    children,
    onExited = noop,
    variant
}) => {
    const [visible, setVisible] = useState(true);

    const hideOverlay = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        noScrollBodyClassNames.forEach(className => document.body.classList.add(className));

        return () => {
            noScrollBodyClassNames.forEach(className => document.body.classList.remove(className));
        };
    }, []);

    return (
        <Portal data-role="overlay-layout" className={"absolute z-overlay"}>
            <OverlayRoot visible={visible} onExited={onExited}>
                <OverlayBackdrop visible={visible} hideOverlay={hideOverlay} />
                <OverlayContent visible={visible}>
                    <OverlayHeader
                        start={barLeft}
                        middle={barMiddle}
                        end={barRight}
                        variant={variant}
                        hideOverlay={hideOverlay}
                    />
                    <div className={"flex-1 min-h-0 overflow-hidden"}>{children}</div>
                </OverlayContent>
            </OverlayRoot>
        </Portal>
    );
};
