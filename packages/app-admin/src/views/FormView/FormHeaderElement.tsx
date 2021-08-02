import React from "react";
import { css } from "emotion";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { UIElement, UIElementConfig } from "@webiny/ui-composer/UIElement";
import { Icon } from "@webiny/ui/Icon";
import { FormElementRenderProps } from "~/elements/form/FormElement";

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

interface FormHeaderConfig extends UIElementConfig {
    getTitle(props: FormElementRenderProps): string;
    icon?: React.ReactElement;
}

export class FormHeaderElement extends UIElement<FormHeaderConfig> {
    constructor(id, config: FormHeaderConfig) {
        super(id, config);

        this.useGrid(false);
    }

    setIcon(icon: React.ReactElement) {
        this.config.icon = icon;
    }

    addAction(element: UIElement) {
        this.addElement(element);
    }

    render(props: any): any {
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
                    {super.render(props)}
                </Cell>
            </Grid>
        );
    }
}
