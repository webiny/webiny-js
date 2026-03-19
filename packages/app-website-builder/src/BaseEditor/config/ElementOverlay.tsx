import React from "react";
import { Element as BaseElement, type ElementProps as BaseElementProps } from "./Element.js";
import { Elements as BaseElements } from "./Elements.js";
import { useElementOverlay } from "~/BaseEditor/hooks/useElementOverlay.js";

export type ElementProps = Pick<BaseElementProps, "name" | "element">;

const Element = ({ name, element }: ElementProps) => {
    return <BaseElement name={name} element={element} scope={"elementOverlay"} />;
};

const Elements = () => {
    return <BaseElements scope={"elementOverlay"} />;
};

export interface ElementOverlayContainerProps {
    position: {
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
    };
    children: React.ReactNode;
}

const empty = undefined;

const Container = ({ position, children }: ElementOverlayContainerProps) => {
    const { box } = useElementOverlay();

    const top = position.top !== empty ? box.top + position.top : empty;
    const left = position.left !== empty ? box.left + position.left : empty;
    const bottom = position.bottom !== empty ? box.top + box.height - position.bottom : empty;
    const right = position.right !== empty ? box.left + box.width - position.right : empty;

    return (
        <div
            data-role={"element-overlay"}
            className={"absolute pointer-events-auto"}
            style={{ top: top ?? bottom, left: left ?? right, zIndex: 100 + box.depth + 100 }}
        >
            {children}
        </div>
    );
};

export const ElementOverlay = {
    Element: Object.assign(Element, { Container }),
    Elements
};
