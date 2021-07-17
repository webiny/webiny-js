import React from "react";
import { css } from "emotion";
import { Form, FormOnSubmit } from "@webiny/form";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";
import { SimpleForm, SimpleFormHeader } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";
import { ButtonElement } from "~/views/Users/elements/ButtonElement";
import { Element } from "~/views/Users/elements/Element";
import { GenericElement } from "~/views/Users/elements/GenericElement";
import { CircularProgress } from "@webiny/ui/Progress";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    textAlign: "right",
    padding: 25
});

const iconClass = css({
    marginRight: 15,
    color: "var(--mdc-theme-text-primary-on-background)"
});

const headerClass = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

const titleClass = css({
    display: "flex",
    alignItems: "center"
});

const actionsClass = css({
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center"
});

interface Config {
    onSubmit: (props: any) => FormOnSubmit;
    getTitle: ({ viewProps }) => string;
    getFormData: ({ viewProps }) => Record<string, any>;
    isLoading: ({ viewProps }) => boolean;
    onCancel: ({ viewProps }) => void;
}

interface SimpleFormHeaderConfig {
    getTitle(props: any): string;
    icon?: React.ReactElement<any>;
}

export class SimpleFormHeaderElement extends LayoutElement<SimpleFormHeaderConfig> {
    constructor(id, config) {
        super(id, config);

        this.toggleGrid(false);
    }
    
    setIcon(icon: React.ReactElement<any>) {
        this._config.icon = icon;
    }

    render(props: any, depth = 0): any {
        const { icon, getTitle } = this._config;

        return (
            <Grid className={headerClass}>
                <Cell span={6} className={titleClass}>
                    <React.Fragment>
                        {icon && <Icon className={iconClass} icon={icon} />}
                        <Typography use="headline5">{getTitle(props)}</Typography>
                    </React.Fragment>
                </Cell>
                <Cell span={6} className={actionsClass}>
                    {super.render(props, depth)}
                </Cell>
            </Grid>
        );
    }
}

export class SimpleFormContentElement extends LayoutElement {}

export class SimpleFormFooterElement extends LayoutElement {
    constructor(id) {
        super(id);

        this.toggleGrid(false);
    }

    render(viewProps) {
        return <ButtonWrapper>{super.render(viewProps)}</ButtonWrapper>;
    }
}

export class SimpleFormElement extends LayoutElement<Config> {
    constructor(id, config) {
        super(id, config);

        this.addElements();
        this.toggleGrid(false);
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
