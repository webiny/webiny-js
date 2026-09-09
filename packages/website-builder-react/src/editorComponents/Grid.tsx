import React from "react";
import type { ComponentProps, ComponentPropsWithChildren } from "~/types.js";
import { createGridClass, createGridStackingCss } from "./gridStyles.js";

export const GridColumnComponent = ({
    inputs
}: {
    inputs: ComponentPropsWithChildren["inputs"];
}) => {
    return <>{inputs.children}</>;
};

export interface Column {
    children: React.ReactNode;
}

type GridProps = ComponentProps<{
    gridLayout: string;
    rowCount: number;
    rowGap: number;
    columnGap: number;
    columns: Column[];
    stackAtBreakpoint?: string;
    reverseWhenStacked?: boolean;
}>;

export const GridComponent = ({ inputs, styles, element }: GridProps) => {
    const { gridLayout = "12", columns, columnGap, stackAtBreakpoint, reverseWhenStacked } = inputs;
    const rowConfig = gridLayout.split("-").map(size => parseInt(size));
    const rows: Column[][] = [];

    // Chunk columns into rows
    for (let i = 0; i < columns.length; i += rowConfig.length) {
        rows.push(columns.slice(i, i + rowConfig.length));
    }

    // Number of pixels we need to subtract from each cell to ensure they fit in the grid with column gap
    const cellWidthReduction = columnGap ? columnGap - columnGap / rowConfig.length : 0;

    const gridClass = createGridClass(element.id);

    // Columns stack via a CSS media query (see createGridStackingCss).
    const stackCss = createGridStackingCss({ gridClass, stackAtBreakpoint, reverseWhenStacked });

    return (
        <div className={gridClass} style={styles}>
            {/*
                A media query can't be expressed in an inline `style` attribute (that only
                holds declarations, not at-rules), so the stacking CSS is emitted as a
                scoped <style> tag. A <style> is `display:none` and valid inside <body>,
                so it doesn't affect the grid's flex layout.
            */}
            {stackCss ? <style dangerouslySetInnerHTML={{ __html: stackCss }} /> : null}
            {rows.map(columns => {
                return columns.map((column, i) => (
                    <Span key={i} size={rowConfig[i]} reductionInPx={cellWidthReduction}>
                        <GridColumnComponent key={i} inputs={{ children: column.children }} />
                    </Span>
                ));
            })}
        </div>
    );
};

interface SpanProps {
    size: number;
    reductionInPx: number;
    children: React.ReactNode;
}

const Span = ({ size, children, reductionInPx }: SpanProps) => {
    // Base (row) width. The Grid's media query overrides this to 100% when stacked.
    const width = `calc(${(size / 12) * 100}% - ${reductionInPx}px)`;

    return (
        <div
            className="wb-grid-col"
            style={{
                flex: `0 0 ${width}`,
                maxWidth: width,
                boxSizing: "border-box"
            }}
        >
            {children}
        </div>
    );
};
