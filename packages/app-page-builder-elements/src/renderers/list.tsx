import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element, ElementRenderer, ElementRendererProps } from "~/types";
import styled from "@emotion/styled";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

interface PbListProps {
    className?: string;
    element: Element;
}

const PbList: React.FC<{ className?: string; element: Element }> = ({ className, element }) => (
    <pb-list class={className} dangerouslySetInnerHTML={{ __html: element.data.text.data.text }} />
);

export interface ListComponentProps extends ElementRendererProps {
    as?: React.FC<PbListProps>;
}

export type ListComponent = ElementRenderer<ListComponentProps>;

const List: ListComponent = ({ element, as }) => {
    const { getElementStyles, getThemeStyles } = usePageElements();

    const styles = [
        { display: "block" },
        ...getElementStyles(element),
        ...getThemeStyles(theme => theme?.styles?.list)
    ];

    const Component = as || PbList;
    const StyledComponent = styled(Component)(styles);

    return <StyledComponent element={element} />;
};

export const createList = () => {
    return React.memo(List, (prevProps, nextProps) => {
        if (prevProps.as !== nextProps.as) {
            return false;
        }

        return elementDataPropsAreEqual(prevProps, nextProps);
    });
};
