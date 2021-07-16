import React from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { ButtonElement } from "~/views/Users/elements/ButtonElement";
import { Element } from "~/views/Users/elements/Element";
import { GenericElement } from "~/views/Users/elements/GenericElement";
import { CircularProgress } from "@webiny/ui/Progress";

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

interface Config {
    onSubmit: (props: any) => FormOnSubmit;
    getTitle: ({ viewProps }) => string;
    getFormData: ({ viewProps }) => Record<string, any>;
    isLoading: ({ viewProps }) => boolean;
    onCancel: ({ viewProps }) => void;
}

export class SimpleFormHeaderElement extends Element {
    render(props) {
        return <SimpleFormHeader title={this._config.getTitle(props)} />;
    }
}

export class SimpleFormContentElement extends LayoutElement {
    render(viewProps) {
        return <SimpleFormContent>{super.render(viewProps)}</SimpleFormContent>;
    }
}

export class SimpleFormFooterElement extends LayoutElement {
    constructor(id) {
        super(id);

        this.disableGrid();
    }

    render(viewProps) {
        return (
            <SimpleFormFooter>
                <ButtonWrapper>{super.render(viewProps)}</ButtonWrapper>
            </SimpleFormFooter>
        );
    }
}

export class SimpleFormElement extends LayoutElement<Config> {
    constructor(id, config) {
        super(id, config);

        this.addElements();
        this.disableGrid();
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
        this.addElement(
            new GenericElement("loading", props => {
                return this._config.isLoading(props) ? <CircularProgress /> : <span />;
            })
        );

        this.addElement(
            new SimpleFormHeaderElement("formHeader", {
                getTitle: props => {
                    return this._config.getTitle(props);
                }
            })
        );

        this.addElement(new SimpleFormContentElement("formContent"));

        const footer = new SimpleFormFooterElement("formFooter");
        this.addElement(footer);

        const cancelButton = footer.addElement(
            new ButtonElement("cancel", {
                type: "default",
                label: "Cancel",
                onClick: ({ viewProps }) => viewProps.cancelEditing()
            })
        );

        footer.insertElementToTheRightOf(
            cancelButton,
            new ButtonElement("submit", {
                type: "primary",
                label: "Save user",
                onClick: ({ formProps }) => formProps.submit()
            })
        );
    }

    render(viewProps: any) {
        return (
            <Form
                data={this._config.getFormData({ viewProps })}
                onSubmit={this._config.onSubmit({ viewProps })}
            >
                {formProps => <SimpleForm>{super.render({ viewProps, formProps })}</SimpleForm>}
            </Form>
        );
    }
}
