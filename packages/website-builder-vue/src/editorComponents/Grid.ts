import { h } from "vue";
import type { ComponentProps } from "~/types.js";
import type { VNode } from "vue";

interface Column {
    children: VNode | null;
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

/**
 * Renders a flexible CSS grid with rows/columns derived from `gridLayout`
 * (e.g. "6-6" = two equal columns, "4-8" = one-third + two-thirds, etc.).
 *
 * The children of each column are VNodes resolved by the SDK (ElementSlot).
 */
export const GridComponent = (props: GridProps) => {
    const { inputs, styles, breakpoint } = props;
    const {
        gridLayout = "12",
        columns = [],
        columnGap,
        stackAtBreakpoint,
        reverseWhenStacked
    } = inputs;

    const rowConfig = gridLayout.split("-").map(s => parseInt(s));
    const rows: Column[][] = [];

    for (let i = 0; i < columns.length; i += rowConfig.length) {
        rows.push(columns.slice(i, i + rowConfig.length));
    }

    const cellWidthReduction = columnGap ? columnGap - columnGap / rowConfig.length : 0;
    const stackColumns = breakpoint === stackAtBreakpoint;

    const gridStyles = { ...styles };
    if (stackColumns) {
        gridStyles.flexDirection = reverseWhenStacked ? "column-reverse" : "column";
    }

    const cells = rows.flatMap(rowCols =>
        rowCols.map((col, i) => {
            const width = stackColumns
                ? "100%"
                : `calc(${(rowConfig[i] / 12) * 100}% - ${cellWidthReduction}px)`;

            return h(
                "div",
                {
                    key: i,
                    style: {
                        flex: `0 0 ${width}`,
                        maxWidth: width,
                        boxSizing: "border-box"
                    }
                },
                [col.children]
            );
        })
    );

    return h("div", { style: gridStyles }, cells);
};
