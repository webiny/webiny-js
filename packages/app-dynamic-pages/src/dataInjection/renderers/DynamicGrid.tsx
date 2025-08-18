import React from "react";
import { ElementInput, Elements, useRenderer } from "@webiny/app-page-builder-elements";
import { GridRenderer } from "@webiny/app-page-builder-elements/renderers/grid";
import type { GenericRecord } from "@webiny/app/types";
import { DataSourceDataProvider } from "@webiny/app-page-builder/dataInjection";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const elementInputs = {
    dataSource: ElementInput.create<GenericRecord[]>({
        name: "dataSource",
        type: "array",
        translatable: false,
        getDefaultValue() {
            return [];
        }
    })
};

export const DynamicGrid = GridRenderer.Component.createDecorator(Original => {
    return function DynamicGrid(props) {
        const { getElement, getInputValues } = useRenderer();
        const element = getElement();
        const inputs = getInputValues<typeof elementInputs>();

        if (Array.isArray(inputs.dataSource)) {
            const hasData = inputs.dataSource.length > 0;

            const baseCell = element.elements[0];
            const dynamicElement = {
                ...element,
                elements: hasData
                    ? Array(inputs.dataSource.length).fill(baseCell)
                    : element.elements
            };

            return (
                <Elements
                    element={dynamicElement}
                    wrapper={(element, index) => {
                        const dataSource = inputs.dataSource ? inputs.dataSource[index] : {};

                        return (
                            <DataSourceDataProvider dataSource={dataSource}>
                                {element}
                            </DataSourceDataProvider>
                        );
                    }}
                />
            );
        }

        return <Original {...props} />;
    };
});
