import * as React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Icon } from "@webiny/ui/Icon";

const SimpleFormContainer = styled("div")({
    position: "relative",
    margin: "17px 50px"
});

const header = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

const title = css({
    display: "flex",
    alignItems: "center"
});

const actions = css({
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center"
});

const icon = css({
    marginRight: 15,
    color: "var(--mdc-theme-text-primary-on-background)"
});

const footer = css({
    borderTop: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    textAlign: "right",
    "&.mdc-layout-grid": {
        padding: 25 // "25px 50px"
    }
});

export const SimpleForm = (props: {
    "data-testid"?: string;
    children: React.ReactNode;
    noElevation?: boolean;
}) => {
    return (
        <SimpleFormContainer className={"webiny-data-list"} data-testid={props["data-testid"]}>
            {props.noElevation ? props.children : <Elevation z={1}>{props.children}</Elevation>}
        </SimpleFormContainer>
    );
};

export const SimpleFormHeader = (props: {
    title: string;
    icon?: React.ReactElement<any>;
    children?: React.ReactNode;
}) => {
    return (
        <Grid className={header}>
            <Cell span={6} className={title}>
                <React.Fragment>
                    {props.icon && <Icon className={icon} icon={props.icon} />}
                    <Typography use="headline5">{props.title}</Typography>
                </React.Fragment>
            </Cell>
            <Cell span={6} className={actions}>
                {props.children}
            </Cell>
        </Grid>
    );
};

export const SimpleFormFooter = (props: { children: React.ReactNode }) => {
    return (
        <Grid className={footer}>
            <Cell span={12}>{props.children}</Cell>
        </Grid>
    );
};

export const SimpleFormContent = (props: { children: any }): any => {
    return props.children;
};
