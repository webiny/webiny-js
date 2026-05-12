"use client";
import {
    createBooleanInput,
    createElement,
    createNumberInput,
    createObjectInput,
    createSelectInput,
    createSlotInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { GridComponent } from "./Grid.js";

export interface Column {
    children: React.ReactNode;
}
export const Grid = createComponent(GridComponent, {
    name: "Webiny/Grid",
    label: "Grid",
    aiContext:
        "Multi-column layout container. Set gridLayout to a dash-separated pattern (e.g. '6-6' for two equal columns, '8-4' for wide-narrow, '4-4-4' for three equal). Each segment becomes a GridColumn. Columns stack vertically on smaller screens when stackAtBreakpoint is set.",
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM8 20H4V16H8V20ZM8 14H4V10H8V14ZM8 8H4V4H8V8ZM14 20H10V16H14V20ZM14 14H10V10H14V14ZM14 8H10V4H14V8ZM20 20H16V16H20V20ZM20 14H16V10H20V14ZM20 8H16V4H20V8Z" fill="#59626D"/>
</svg>`,
    group: "basic",
    autoApplyStyles: false,
    inputs: [
        createTextInput({
            name: "gridLayout",
            label: "Grid Layout",
            renderer: "Webiny/GridLayout",
            onChange: ({ inputs, createElement }) => {
                const rowColumnCount = inputs.gridLayout.split("-").length;
                const columns = inputs.columns.length;

                const remainder = columns % rowColumnCount;

                if (remainder !== 0) {
                    const fullColumnCount = rowColumnCount * inputs.rowCount;
                    const toCreate =
                        columns > fullColumnCount ? remainder : rowColumnCount - remainder;

                    Array.from({ length: toCreate }).forEach(() => {
                        inputs.columns.push({
                            children: createElement({
                                component: "Webiny/GridColumn"
                            })
                        });
                    });
                }

                inputs.rowCount = inputs.columns.length / rowColumnCount;
            }
        }),
        createNumberInput({
            name: "rowCount",
            label: "Row Count",
            defaultValue: 1,
            minValue: 1,
            onChange: ({ inputs, createElement }) => {
                const gridLayout = inputs.gridLayout;
                const columnCount = gridLayout.split("-").length;
                const rowCount = Math.max(1, inputs.rowCount);
                const columns = inputs.columns;
                const rows: Column[][] = [];

                // Chunk columns into rows
                for (let i = 0; i < columns.length; i += columnCount) {
                    rows.push(columns.slice(i, i + columnCount));
                }

                if (rows.length > rowCount) {
                    inputs.columns = columns.slice(0, columnCount * rowCount);
                    return;
                }

                const createRows = Math.max(0, rowCount - rows.length);

                if (createRows <= 0) {
                    return;
                }

                const newRows = Array.from({ length: createRows * columnCount }).map(() => {
                    return {
                        children: createElement({
                            component: "Webiny/GridColumn"
                        })
                    };
                });

                inputs.columns.push(...newRows);
            }
        }),
        createNumberInput({
            name: "rowGap",
            label: "Row Gap",
            defaultValue: 0,
            responsive: true,
            onChange: ({ inputs, styles }) => {
                const rowGap = parseInt(inputs.rowGap);
                if (isNaN(rowGap)) {
                    delete styles.rowGap;
                } else {
                    styles.rowGap = `${inputs.rowGap}px`;
                }
            }
        }),
        createNumberInput({
            name: "columnGap",
            label: "Column Gap",
            defaultValue: 0,
            responsive: true,
            onChange: ({ inputs, styles }) => {
                const columnGap = parseInt(inputs.columnGap);
                if (isNaN(columnGap)) {
                    delete styles.columnGap;
                } else {
                    styles.columnGap = `${inputs.columnGap}px`;
                }
            }
        }),
        createSelectInput({
            name: "stackAtBreakpoint",
            label: "Stack at breakpoint",
            options: [
                { label: "Tablet", value: "tablet" },
                { label: "Mobile", value: "mobile" }
            ]
        }),
        createBooleanInput({
            name: "reverseWhenStacked",
            label: "Reverse columns when stacked"
        }),
        createObjectInput({
            name: "columns",
            list: true,
            hideFromUi: true,
            fields: [
                createSlotInput({
                    name: "children",
                    list: false,
                    components: ["Webiny/GridColumn"]
                })
            ]
        })
    ],
    defaults: {
        inputs: {
            gridLayout: "6-6",
            columns: [
                {
                    children: createElement({
                        component: "Webiny/GridColumn",
                        inputs: {
                            children: [
                                createElement({
                                    component: "Webiny/Lexical"
                                })
                            ]
                        }
                    })
                },
                {
                    children: createElement({
                        component: "Webiny/GridColumn",
                        inputs: {
                            children: [
                                createElement({
                                    component: "Webiny/Lexical"
                                })
                            ]
                        }
                    })
                }
            ]
        },
        styles: {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "stretch",
            width: "100%",
            marginTop: "0px",
            marginBottom: "0px",
            marginLeft: "0px",
            marginRight: "0px",
            paddingTop: "5px",
            paddingRight: "5px",
            paddingBottom: "5px",
            paddingLeft: "5px"
        }
    }
});
