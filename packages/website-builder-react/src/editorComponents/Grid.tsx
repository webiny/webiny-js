import React from "react";
import type { ComponentProps, ComponentPropsWithChildren } from "~/types.js";

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

export const GridComponent = ({ inputs, styles, breakpoint }: GridProps) => {
    const { gridLayout = "12", columns, columnGap, stackAtBreakpoint, reverseWhenStacked } = inputs;
    const rowConfig = gridLayout.split("-").map(size => parseInt(size));
    const rows: Column[][] = [];

    // Chunk columns into rows
    for (let i = 0; i < columns.length; i += rowConfig.length) {
        rows.push(columns.slice(i, i + rowConfig.length));
    }

    // Number of pixels we need to subtract from each cell to ensure they fit in the grid with column gap
    const cellWidthReduction = columnGap ? columnGap - columnGap / rowConfig.length : 0;

    const stackColumns = breakpoint === stackAtBreakpoint;

    if (stackColumns) {
        styles.flexDirection = reverseWhenStacked ? "column-reverse" : "column";
    }

    return (
        <div style={styles}>
            {rows.map(columns => {
                return columns.map((column, i) => (
                    <Span
                        key={i}
                        stackColumns={stackColumns}
                        size={rowConfig[i]}
                        reductionInPx={cellWidthReduction}
                    >
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
    stackColumns: boolean;
    children: React.ReactNode;
}

const Span = ({ size, children, reductionInPx, stackColumns }: SpanProps) => {
    const width = stackColumns ? "100%" : `calc(${(size / 12) * 100}% - ${reductionInPx}px)`;

    return (
        <div
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
