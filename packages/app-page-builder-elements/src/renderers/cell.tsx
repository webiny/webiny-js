import React, { useMemo } from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-cell": any;
        }
    }
}

const Cell: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    const width = useMemo<string>(() => {
        return `${(element.data?.settings?.grid?.size / 12) * 100}%`;
    }, [element.id]);

    const styles = [
        ...getStyles({ display: "block", width }),
        ...getThemeStyles(() => {
            return { tablet: { width: "100%" } };
        }),
        ...getElementStyles(element)
    ];

    const PbCell = styled(({ className, children }) => (
        <pb-cell class={className}>{children}</pb-cell>
    ))(styles);

    return (
        <PbCell>
            <Elements element={element} />
        </PbCell>
    );
};

export const createCell = () => Cell;
