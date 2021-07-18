import React from "react";
import { css } from "emotion";
import { Form, FormOnSubmit, FormRenderPropParams } from "@webiny/form";
import styled from "@emotion/styled";
import classNames from "classnames";
import { ButtonElement } from "~/views/Users/elements/ButtonElement";
import { Element, ElementConfig } from "~/views/Users/elements/Element";
import { GenericElement } from "~/views/Users/elements/GenericElement";
import { CircularProgress } from "@webiny/ui/Progress";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { FormElement } from "~/views/Users/elements/FormElement";
import { Elevation } from "@webiny/ui/Elevation";

const SimpleFormContainerWrapper = styled("div")({
    position: "relative",
    margin: "17px 50px"
});

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

interface SimpleFormHeaderConfig extends ElementConfig {
    getTitle(props: any): string;
    icon?: React.ReactElement<any>;
}

export class SimpleFormHeaderElement extends Element<SimpleFormHeaderConfig> {
    constructor(id, config) {
        super(id, config);

        this.toggleGrid(false);
    }

    setIcon(icon: React.ReactElement<any>) {
        this.config.icon = icon;
    }

    render(props: any, depth = 0): any {
        const { icon, getTitle } = this.config;

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

export class SimpleFormContentElement extends Element {}

export class SimpleFormFooterElement extends Element {
    constructor(id) {
        super(id);

        this.toggleGrid(false);
    }

    render(viewProps) {
        return <ButtonWrapper>{super.render(viewProps)}</ButtonWrapper>;
    }
}

interface SimpleFormContainerConfig extends ElementConfig {
    testId?: string;
    noElevation?: boolean;
    className?: string;
}

class SimpleFormContainer extends Element<SimpleFormContainerConfig> {
    constructor(id: string, config: SimpleFormContainerConfig) {
        super(id, config);
        this.toggleGrid(false);
    }

    render(props, depth) {
        const children = super.render(props, depth);

        return (
            <SimpleFormContainerWrapper
                className={classNames("webiny-data-list", this.config.className)}
                data-testid={this.config.testId}
            >
                {this.config.noElevation ? children : <Elevation z={1}>{children}</Elevation>}
            </SimpleFormContainerWrapper>
        );
    }
}

export interface SimpleFormElementRenderProps<TViewProps = Record<string, any>> {
    viewProps: TViewProps;
    formProps?: FormRenderPropParams;
}

interface SimpleFormElementConfig<TViewProps> extends ElementConfig {
    onSubmit: (props: SimpleFormElementRenderProps<TViewProps>) => FormOnSubmit;
    getTitle: (props: SimpleFormElementRenderProps<TViewProps>) => string;
    getFormData: (props: SimpleFormElementRenderProps<TViewProps>) => Record<string, any>;
    isLoading: (props: SimpleFormElementRenderProps<TViewProps>) => boolean;
    onCancel: (props: SimpleFormElementRenderProps<TViewProps>) => void;
    testId?: string;
    noElevation?: boolean;
    className?: string;
}

export class SimpleFormElement<TViewProps> extends Element<SimpleFormElementConfig<TViewProps>> {
    constructor(id, config: SimpleFormElementConfig<TViewProps>) {
        super(id, config);

        this.addElements();
        this.toggleGrid(false);
    }

    addElement(element: Element<any>): Element<any> {
        if (element.id === "form") {
            return super.addElement(element);
        }

        return this.getElement("container").addElement(element);
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
        const form = this.addElement(
            new FormElement<TViewProps>("form", {
                onSubmit: props => this.config.onSubmit(props),
                getData: props => this.config.getFormData(props)
            })
        ) as FormElement<TViewProps>;

        form.addElement(
            new SimpleFormContainer("container", {
                testId: this.config.testId,
                className: this.config.className,
                noElevation: this.config.noElevation
            })
        );

        this.addElement(
            new GenericElement("loading", props => {
                return this.config.isLoading(props) ? <CircularProgress /> : null;
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

        const cancelButton = footer.addElement(
            new ButtonElement("cancel", {
                type: "default",
                label: "Cancel",
                onClick: ({ viewProps }) => viewProps.cancelEditing()
            })
        );

        const submitButton = new ButtonElement("submit", {
            type: "primary",
            label: "Save user",
            onClick: ({ formProps }) => formProps.submit()
        });
        submitButton.moveToTheRightOf(cancelButton);
    }
}
