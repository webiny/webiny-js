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

export const Grid = createComponent(GridComponent, {
    name: "Webiny/Grid",
    label: "Grid",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520ZM200-600h160v-160H200v160Zm400 0h160v-160H600v160Zm0 400h160v-160H600v160Zm-400 0h160v-160H200v160Zm400-400Zm0 240Zm-240 0Zm0-240Z"/></svg>`,
    group: "basic",
    autoApplyStyles: false,
    inputs: [
        createTextInput({
            name: "gridLayout",
            label: "Grid Layout",
            renderer: "Webiny/GridLayout",
            onChange: ({ inputs, createElement: ce }) => {
                const rowColumnCount = inputs.gridLayout.split("-").length;
                const columns = inputs.columns.length;
                const remainder = columns % rowColumnCount;

                if (remainder !== 0) {
                    const fullColumnCount = rowColumnCount * inputs.rowCount;
                    const toCreate =
                        columns > fullColumnCount ? remainder : rowColumnCount - remainder;

                    Array.from({ length: toCreate }).forEach(() => {
                        inputs.columns.push({
                            children: ce({ component: "Webiny/GridColumn" })
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
            onChange: ({ inputs, createElement: ce }) => {
                const columnCount = inputs.gridLayout.split("-").length;
                const rowCount = Math.max(1, inputs.rowCount);
                const columns = inputs.columns;
                const rows: unknown[][] = [];

                for (let i = 0; i < columns.length; i += columnCount) {
                    rows.push(columns.slice(i, i + columnCount));
                }

                if (rows.length > rowCount) {
                    inputs.columns = columns.slice(0, columnCount * rowCount);
                    return;
                }

                const createRows = Math.max(0, rowCount - rows.length);
                if (createRows <= 0) {return;}

                const newRows = Array.from({ length: createRows * columnCount }).map(() => ({
                    children: ce({ component: "Webiny/GridColumn" })
                }));

                inputs.columns.push(...newRows);
            }
        }),
        createNumberInput({
            name: "rowGap",
            label: "Row Gap",
            defaultValue: 0,
            responsive: true,
            onChange: ({ inputs, styles }) => {
                const v = parseInt(inputs.rowGap);
                if (isNaN(v)) {delete styles.rowGap;}
                else {styles.rowGap = `${inputs.rowGap}px`;}
            }
        }),
        createNumberInput({
            name: "columnGap",
            label: "Column Gap",
            defaultValue: 0,
            responsive: true,
            onChange: ({ inputs, styles }) => {
                const v = parseInt(inputs.columnGap);
                if (isNaN(v)) {delete styles.columnGap;}
                else {styles.columnGap = `${inputs.columnGap}px`;}
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
                        inputs: { children: [createElement({ component: "Webiny/Lexical" })] }
                    })
                },
                {
                    children: createElement({
                        component: "Webiny/GridColumn",
                        inputs: { children: [createElement({ component: "Webiny/Lexical" })] }
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
