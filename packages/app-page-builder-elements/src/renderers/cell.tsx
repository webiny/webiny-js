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

const PbCell: React.FC<{ className?: string }> = ({ className, children }) => (
    <pb-cell class={className}>{children}</pb-cell>
);

const Cell: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    const width = useMemo<string>(() => {
        const size = element.data?.settings?.grid?.size;
        if (typeof size !== "number") {
            return "100%";
        }
        return `${(size / 12) * 100}%`;
    }, [element.id]);

    const styles = [
        ...getStyles({ display: "block", width }),
        ...getThemeStyles(theme => theme.styles.cell),
        ...getElementStyles(element)
    ];

    const StyledPbCell = styled(PbCell)(styles);

    return (
        <StyledPbCell>
            <Elements element={element} />
        </StyledPbCell>
    );
};

export const createCell = () => Cell;
