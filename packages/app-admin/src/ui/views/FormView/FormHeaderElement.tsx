import React from "react";
import { css } from "emotion";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { Icon } from "@webiny/ui/Icon";
import { FormElementRenderProps } from "~/ui/elements/form/FormElement";

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
    public constructor(id: string, config: FormHeaderConfig) {
        super(id, config);

        this.useGrid(false);
    }

    public setIcon(icon: React.ReactElement) {
        this.config.icon = icon;
    }

    public addAction(element: UIElement) {
        this.addElement(element);
    }

    public override render(props: FormElementRenderProps): React.ReactNode {
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
