import React from "react";
import { Transition } from "react-transition-group";
import type { ExitHandler } from "react-transition-group/Transition";

interface OverlayRootProps {
    visible?: boolean;
    onExited?: ExitHandler<HTMLElement>;
    children: React.ReactNode;
}

const OverlayRoot = ({ visible, onExited, children }: OverlayRootProps) => {
    return (
        <Transition in={visible} timeout={100} appear onExited={onExited}>
            <div className={"pointer-events-auto"}>{children}</div>
        </Transition>
    );
};

export { OverlayRoot, type OverlayRootProps };
