import React from "react";
import { Transition } from "react-transition-group";
import styled from "@emotion/styled";
import { View } from "@webiny/ui-composer/View";
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
    zIndex: 18,
    top: 0,
    left: 0
});

const defaultStyle = {
    transform: "translateY(75vh)",
    opacity: 0,
    transitionProperty: "transform, opacity",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "225ms",
    willChange: "opacity, transform"
};

const transitionStyles = {
    entering: { transform: "translateY(75vh)", opacity: 0 },
    entered: { transform: "translateY(0px)", opacity: 1 }
};

interface OnExited {
    (view: OverlayView): void;
}

export class OverlayView extends View {
    private _onExited: OnExited[] = [];

    constructor(id = "OverlayView") {
        super(id);
        this.toggleGrid(false);

        this.addHookDefinition("overlay", useOverlayView);

        this.addElement(
            new HeaderElement("overlayHeader", {
                onClose: () => this.setIsVisible(false)
            })
        );

        this.addElement(new ContentElement("overlayContent"));

        this.applyPlugins(OverlayView);
    }
    
    setTitle(title: () => string) {
        this.getHeaderElement().setTitle(title);
    }

    onExited() {
        [...this._onExited].reverse().forEach(cb => cb(this));
    }

    addOnExited(cb: OnExited) {
        this._onExited.push(cb);
    }

    getOverlayHook() {
        return this.getHook<UseOverlayView>("overlay");
    }

    setIsVisible(visible: boolean) {
        this.getOverlayHook().setIsVisible(visible);
    }

    getHeaderElement(): HeaderElement {
        return this.getElement("overlayHeader");
    }

    getContentElement(): ContentElement {
        return this.getElement("overlayContent");
    }

    render(props) {
        const { isVisible } = this.getOverlayHook();
        return (
            <Transition in={isVisible} timeout={100} appear onExited={() => this.onExited()}>
                {state => (
                    <OverlayLayoutWrapper style={{ ...defaultStyle, ...transitionStyles[state] }}>
                        {super.render(props)}
                    </OverlayLayoutWrapper>
                )}
            </Transition>
        );
    }
}
