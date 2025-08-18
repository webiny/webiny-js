import React from "react";
import { ElementInput, Elements, useRenderer } from "@webiny/app-page-builder-elements";
import { PeGrid } from "@webiny/app-page-builder/editor/plugins/elements/grid/PeGrid";
import { useElementWithChildren } from "@webiny/app-page-builder/editor";
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

export const DynamicGrid = PeGrid.Component.createDecorator(Original => {
    return function DynamicGrid(props) {
        const { getElement, getInputValues } = useRenderer();
        const element = getElement();
        const elementWithChildren = useElementWithChildren(element.id);
        const inputs = getInputValues<typeof elementInputs>();

        if (!elementWithChildren) {
            return null;
        }

        if (Array.isArray(inputs.dataSource)) {
            const hasData = inputs.dataSource.length > 0;

            const baseCell = elementWithChildren.elements[0];
            const dynamicElement = {
                ...element,
                elements: hasData
                    ? Array(inputs.dataSource.length).fill(baseCell)
                    : elementWithChildren.elements
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
