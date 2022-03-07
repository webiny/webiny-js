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

interface CreateHeaderCallable {
    (params: { actions: DynamicFieldsetActions }): UIElement;
}

interface CreateRowCallable {
    (params: {
        actions: DynamicFieldsetActions;
        index: number;
        row: DynamicFieldsetRowElement;
    }): UIElement;
}

interface CreateEmptyCallable {
    (params: { actions: DynamicFieldsetActions }): UIElement;
}

export interface DynamicFieldsetElementConfig extends FormFieldElementConfig {
    createHeader?: CreateHeaderCallable;
    createRow?: CreateRowCallable;
    createEmpty?: CreateEmptyCallable;
}

export class DynamicFieldsetElement extends FormFieldElement<DynamicFieldsetElementConfig> {
    public constructor(id: string, config: DynamicFieldsetElementConfig) {
        super(id, config);

        this.useGrid(false);

        this.applyPlugins(DynamicFieldsetElement);
    }

    public getCreateHeaderElement() {
        return this.config.createHeader;
    }

    public setHeaderElement(element: UIElement): void {
        this.config.createHeader = () => element;
    }

    public setCreateHeaderElement(cb: DynamicFieldsetElementConfig["createHeader"]): void {
        this.config.createHeader = cb;
    }

    public getCreateRowElement() {
        return this.config.createRow;
    }

    public setCreateRowElement(cb: DynamicFieldsetElementConfig["createRow"]): void {
        this.config.createRow = cb;
    }

    public getCreateEmptyElement() {
        return this.config.createEmpty;
    }

    public setEmptyElement(element: UIElement): void {
        this.config.createEmpty = () => element;
    }

    public setCreateEmptyElement(cb: DynamicFieldsetElementConfig["createEmpty"]): void {
        this.config.createEmpty = cb;
    }

    public override render(props: FormFieldElementRenderProps): React.ReactNode {
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
                                if (!createHeader) {
                                    return null;
                                }
                                const headerElement = createHeader({
                                    actions: actions as DynamicFieldsetActions
                                });
                                // This element is not created via `this.addElement()` API.
                                // We need to manually give it a parent to enable proper grid rendering.
                                headerElement && headerElement.setParent(this);

                                return headerElement ? headerElement.render(props) : null;
                            })}
                            {row(({ index }) => {
                                if (!createRow) {
                                    return null;
                                }
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
                                if (!createEmpty) {
                                    return null;
                                }
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
