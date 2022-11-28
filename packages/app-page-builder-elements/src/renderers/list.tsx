import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-list": any;
        }
    }
}

const defaultStyles = { display: "block" };

const List: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    const styles = [
        ...getStyles(defaultStyles),
        ...getElementStyles(element),
        ...getThemeStyles(theme => theme?.styles?.list)
    ];

    const PbList = styled(({ className }) => (
        <pb-list
            class={className}
            dangerouslySetInnerHTML={{ __html: element.data.text.data.text }}
        />
    ))(styles);

    return <PbList />;
};

export const createList = () => List;
