import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element, ElementRenderer } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-icon": any;
        }
    }
}

interface PbIconProps {
    className?: string;
    element: Element;
}

const PbIcon: React.FC<PbIconProps> = ({ className, element }) => (
    <pb-icon
        data-pe-id={element.id}
        class={className}
        dangerouslySetInnerHTML={{ __html: element.data.icon.svg }}
    />
);

export type IconComponent = ElementRenderer;

const Icon: IconComponent = ({ element }) => {
    const { getElementStyles, theme } = usePageElements();

    let color = element.data.icon.color;
    if (theme.styles.colors?.[color]?.base) {
        color = theme.styles.colors?.[color]?.base;
    }

    const styles = [{ display: "block", color }, ...getElementStyles(element)];

    const StyledComponent = styled(PbIcon)(styles);
    return <StyledComponent element={element} />;
};

export const createIcon = () => React.memo(Icon, elementDataPropsAreEqual);
