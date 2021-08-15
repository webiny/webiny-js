import React from "react";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "~/ui/elements/form/FormFieldElement";
import { UIElement } from "~/ui/UIElement";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Grid } from "@webiny/ui/Grid";
import { DynamicFieldsetRowElement } from "./DynamicFieldsetElement/DynamicFieldsetRowElement";

interface DynamicFieldsetActions {
    add: (index?: number) => () => void;
    remove: (index: number) => () => void;
}

export interface DynamicFieldsetElementConfig extends FormFieldElementConfig {
    createHeader?: (params: { actions: DynamicFieldsetActions }) => UIElement;
    createRow?: (params: {
        actions: DynamicFieldsetActions;
        index: number;
        row: DynamicFieldsetRowElement;
    }) => UIElement;
    createEmpty?: (params: { actions: DynamicFieldsetActions }) => UIElement;
}

export class DynamicFieldsetElement extends FormFieldElement<DynamicFieldsetElementConfig> {
    constructor(id: string, config: DynamicFieldsetElementConfig) {
        super(id, config);

        this.useGrid(false);

        this.applyPlugins(DynamicFieldsetElement);
    }

    getCreateHeaderElement() {
        return this.config.createHeader;
    }

    setHeaderElement(element: UIElement) {
        this.config.createHeader = () => element;
    }

    setCreateHeaderElement(cb: DynamicFieldsetElementConfig["createHeader"]) {
        this.config.createHeader = cb;
    }

    getCreateRowElement() {
        return this.config.createRow;
    }

    setCreateRowElement(cb: DynamicFieldsetElementConfig["createRow"]) {
        this.config.createRow = cb;
    }

    getCreateEmptyElement() {
        return this.config.createEmpty;
    }

    setEmptyElement(element: UIElement) {
        this.config.createEmpty = () => element;
    }

    setCreateEmptyElement(cb: DynamicFieldsetElementConfig["createEmpty"]) {
        this.config.createEmpty = cb;
    }

    render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`DynamicFieldsetElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;
        const createHeader = this.getCreateHeaderElement();
        const createRow = this.getCreateRowElement();
        const createEmpty = this.getCreateEmptyElement();

        return (
            <Bind name={this.getName()} defaultValue={this.getDefaultValue(props)}>
                <DynamicFieldset>
                    {({ actions, header, row, empty }) => (
                        <React.Fragment>
                            {header(() => {
                                const headerElement = createHeader({
                                    actions: actions as DynamicFieldsetActions
                                });
                                // This element is not created via `this.addElement()` API.
                                // We need to manually give it a parent to enable proper grid rendering.
                                headerElement && headerElement.setParent(this);

                                return headerElement ? headerElement.render(props) : null;
                            })}
                            {row(({ index }) => {
                                const rowElement = createRow({
                                    actions: actions as DynamicFieldsetActions,
                                    index,
                                    row: new DynamicFieldsetRowElement(`${this.id}.row.${index}`)
                                });

                                // This element is not created via `this.addElement()` API.
                                // We need to manually give it a parent to enable proper grid rendering.
                                rowElement && rowElement.setParent(this);

                                return rowElement ? <Grid>{rowElement.render(props)}</Grid> : null;
                            })}
                            {empty(() => {
                                const emptyElement = createEmpty({
                                    actions: actions as DynamicFieldsetActions
                                });

                                // This element is not created via `this.addElement()` API.
                                // We need to manually give it a parent to enable proper grid rendering.
                                emptyElement && emptyElement.setParent(this);

                                return emptyElement ? emptyElement.render(props) : null;
                            })}
                        </React.Fragment>
                    )}
                </DynamicFieldset>
            </Bind>
        );
    }
}
