import React from "react";
import { Transition } from "react-transition-group";
import styled from "@emotion/styled";
import { UIView, UIViewProps } from "~/ui/UIView";
import { UseOverlayView, useOverlayView } from "./OverlayView/useOverlayView";
import { HeaderElement } from "./OverlayView/HeaderElement";
import { ContentElement } from "./OverlayView/ContentElement";

// !GOOD FIRST ISSUE!
// Extract rendering and styling into an OverlayViewRenderer class.

const OverlayLayoutWrapper = styled("div")({
    position: "fixed",
    width: "100%",
    height: "100vh",
    backgroundColor: "var(--mdc-theme-background)",
    /**
     * Has to be higher than 5 so it's above advanced settings dialog,
     * and below 20, so the image editor & Dialogs can be displayed above.
     */
    zIndex: 21,
    top: 0,
    left: 0
});

const defaultStyle: Record<string, string | number> = {
    transform: "translateY(75vh)",
    opacity: 0,
    transitionProperty: "transform, opacity",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "225ms",
    willChange: "opacity, transform"
};

const transitionStyles: Record<string, any> = {
    entering: {
        transform: "translateY(75vh)",
        opacity: 0
    },
    entered: {
        transform: "translateY(0px)",
        opacity: 1
    }
};

interface OnExited {
    (view: OverlayView): void;
}

interface OnEntered {
    (view: OverlayView): void;
}

export class OverlayView extends UIView {
    /**
     * This property is used to track the amount of opened overlays. Since we're applying a CSS class to disable
     * window scroll, we must make sure we don't remove that CSS class until all the overlays are closed.
     */
    static openedViews = 0;
    private _onEntered: OnEntered[] = [];
    private _onExited: OnExited[] = [];

    public constructor(id = "OverlayView") {
        super(id);
        this.useGrid(false);

        this.addHookDefinition("overlay", useOverlayView);

        this.addElement(
            new HeaderElement("overlayHeader", {
                onClose: () => this.setIsVisible(false)
            })
        );

        this.addElement(new ContentElement("overlayContent"));

        this.applyPlugins(OverlayView);
    }

    public setTitle(title: () => string): void {
        this.getHeaderElement().setTitle(title);
    }

    public onEntered(): void {
        [...this._onEntered].reverse().forEach(cb => cb(this));
    }

    public onExited(): void {
        [...this._onExited].reverse().forEach(cb => cb(this));
    }

    public addOnEntered(cb: OnExited): void {
        this._onEntered.push(cb);
    }

    public addOnExited(cb: OnExited): void {
        this._onExited.push(cb);
    }

    public getOverlayHook(): UseOverlayView {
        return this.getHook<UseOverlayView>("overlay");
    }

    public setIsVisible(visible: boolean): void {
        this.getOverlayHook().setIsVisible(visible);
    }

    public getHeaderElement(): HeaderElement {
        return this.getElement("overlayHeader") as HeaderElement;
    }

    public getContentElement(): ContentElement {
        return this.getElement("overlayContent") as HeaderElement;
    }

    public override render(props: UIViewProps): React.ReactNode {
        const { isVisible } = this.getOverlayHook();
        return (
            <Transition
                in={isVisible}
                timeout={100}
                appear
                onExited={() => this.onExited()}
                onEntered={() => this.onEntered()}
            >
                {state => (
                    <OverlayLayoutWrapper style={{ ...defaultStyle, ...transitionStyles[state] }}>
                        {super.render(props)}
                    </OverlayLayoutWrapper>
                )}
            </Transition>
        );
    }
}
