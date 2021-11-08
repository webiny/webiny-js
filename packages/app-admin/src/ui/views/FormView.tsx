import React from "react";
import { FormOnSubmit } from "@webiny/form";
import { CircularProgress } from "@webiny/ui/Progress";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { FormElement, FormElementRenderProps } from "~/ui/elements/form/FormElement";
import { ButtonElement } from "~/ui/elements/ButtonElement";
import { GenericElement } from "~/ui/elements/GenericElement";
import { FormContentElement } from "./FormView/FormContentElement";
import { FormHeaderElement } from "./FormView/FormHeaderElement";
import { FormFooterElement } from "./FormView/FormFooterElement";
import { FormContainerElement } from "./FormView/FormContainerElement";
import { UIView } from "~/ui/UIView";

export interface FormViewConfig extends UIElementConfig {
    setupForm?: boolean;
    onSubmit?: FormOnSubmit;
    getTitle?: (props: FormElementRenderProps) => string;
    getFormData?: () => Record<string, any>;
    isLoading?: () => boolean;
    onCancel?: () => void;
    testId?: string;
    noElevation?: boolean;
    className?: string;
}

interface GetterWithProps<T> {
    (props: FormElementRenderProps): T;
}

interface GetterWithoutProps<T> {
    (): T;
}

export class FormView extends UIView<FormViewConfig> {
    constructor(id, config?: FormViewConfig) {
        if (!("setupForm" in config)) {
            config.setupForm = true;
        }

        super(id, config);

        this.addElements();
        this.useGrid(false);

        this.applyPlugins(FormView);
    }

    addElement<TElement extends UIElement = UIElement>(element: TElement): TElement {
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

    getFormContainer(): FormContainerElement {
        return this.getElement("formContainer");
    }

    getFormContentElement(): FormContentElement {
        return this.getElement("formContent");
    }

    getFormHeaderElement(): FormHeaderElement {
        return this.getElement("formHeader");
    }

    getFormFooterElement(): FormFooterElement {
        return this.getElement("formFooter");
    }

    getSubmitButtonElement(): ButtonElement {
        return this.getFormFooterElement().getElement("submit");
    }

    private addElements() {
        const formContainer = new FormContainerElement("formContainer", {
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
            new FormHeaderElement("formHeader", {
                getTitle: props => {
                    return this.config.getTitle(props);
                }
            })
        );

        this.addElement(new FormContentElement("formContent"));

        const footer = new FormFooterElement("formFooter");
        this.addElement(footer);

        const submitButton = new ButtonElement<FormElementRenderProps>("submit", {
            type: "primary",
            label: "Save",
            onClick: props => props.formProps.submit()
        });

        submitButton.moveToTheEndOf(footer);

        const cancelButton = footer.addElement(
            new ButtonElement("cancel", {
                type: "default",
                label: "Cancel",
                onClick: () => this.config.onCancel(),
                shouldRender: () => typeof this.config.onCancel === "function"
            })
        );

        cancelButton.moveToTheBeginningOf(footer);
    }
}
