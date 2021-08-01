import React from "react";
import { FormOnSubmit } from "@webiny/form";
import { CircularProgress } from "@webiny/ui/Progress";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { FormElement, FormElementRenderProps } from "@webiny/app-admin/elements/FormElement";
import { ButtonElement } from "~/elements/ButtonElement";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { SimpleFormContentElement } from "./SimpleFormElement/SimpleFormContentElement";
import { SimpleFormHeaderElement } from "./SimpleFormElement/SimpleFormHeaderElement";
import { SimpleFormFooterElement } from "./SimpleFormElement/SimpleFormFooterElement";
import { SimpleFormContainerElement } from "./SimpleFormElement/SimpleFormContainerElement";
import { View } from "@webiny/ui-composer/View";

export type SimpleFormElementRenderProps = FormElementRenderProps;

export interface SimpleFormViewConfig extends ElementConfig {
    setupForm?: boolean;
    onSubmit?: FormOnSubmit;
    getTitle?: (props: SimpleFormElementRenderProps) => string;
    getFormData?: () => Record<string, any>;
    isLoading?: () => boolean;
    onCancel?: () => void;
    testId?: string;
    noElevation?: boolean;
    className?: string;
}

interface GetterWithProps<T> {
    (props: SimpleFormElementRenderProps): T;
}

interface GetterWithoutProps<T> {
    (): T;
}

export class SimpleFormView extends View<SimpleFormViewConfig> {
    constructor(id, config?: SimpleFormViewConfig) {
        if (!("setupForm" in config)) {
            config.setupForm = true;
        }

        super(id, config);

        this.addElements();
        this.toggleGrid(false);

        this.applyPlugins(SimpleFormView);
    }

    addElement<TElement extends Element = Element>(element: TElement): TElement {
        if (element.id === "form" || element.id === "formContainer") {
            return super.addElement(element);
        }

        return this.getFormContainer().addElement(element);
    }

    setTitle(title: string | GetterWithProps<string>) {
        if (typeof title === "string") {
            this.config.getTitle = () => title;
        } else {
            this.config.getTitle = title;
        }
    }

    setOnSubmit(onSubmit: FormOnSubmit) {
        this.config.onSubmit = onSubmit;
    }

    setFormData(getter: GetterWithoutProps<Record<string, any>>) {
        this.config.getFormData = getter;
    }

    getFormContainer(): SimpleFormContainerElement {
        return this.getElement("formContainer");
    }

    getFormContentElement(): SimpleFormContentElement {
        return this.getElement("formContent");
    }

    getFormHeaderElement(): SimpleFormHeaderElement {
        return this.getElement("formHeader");
    }

    getFormFooterElement(): SimpleFormFooterElement {
        return this.getElement("formFooter");
    }

    getSubmitButtonElement(): ButtonElement {
        return this.getFormFooterElement().getElement("submit");
    }

    private addElements() {
        const formContainer = new SimpleFormContainerElement("formContainer", {
            testId: this.config.testId,
            className: this.config.className,
            noElevation: this.config.noElevation
        });

        if (this.config.setupForm) {
            const form = this.addElement(
                new FormElement("form", {
                    onSubmit: (data, form) => this.config.onSubmit(data, form),
                    getData: () => this.config.getFormData()
                })
            ) as FormElement;

            form.addElement(formContainer);
        } else {
            this.addElement(formContainer);
        }

        this.addElement(
            new GenericElement("loading", () => {
                if (typeof this.config.isLoading !== "function") {
                    return null;
                }

                return this.config.isLoading() ? <CircularProgress /> : null;
            })
        );

        this.addElement(
            new SimpleFormHeaderElement("formHeader", {
                getTitle: props => {
                    return this.config.getTitle(props);
                }
            })
        );

        this.addElement(new SimpleFormContentElement("formContent"));

        const footer = new SimpleFormFooterElement("formFooter");
        this.addElement(footer);

        const submitButton = new ButtonElement<SimpleFormElementRenderProps>("submit", {
            type: "primary",
            label: "Save",
            onClick: props => {
                props.formProps.submit();
            }
        });

        submitButton.moveToTheEndOf(footer);

        if (this.config.onCancel) {
            const cancelButton = footer.addElement(
                new ButtonElement("cancel", {
                    type: "default",
                    label: "Cancel",
                    onClick: () => this.config.onCancel()
                })
            );

            cancelButton.moveToTheBeginningOf(footer);
        }
    }
}
