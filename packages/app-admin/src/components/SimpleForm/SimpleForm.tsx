import * as React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import classNames from "classnames";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
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

const footer = css`
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    border-top: 1px solid var(--mdc-theme-on-background);
    padding: 24px;
    box-sizing: border-box;
    min-height: 52px;
    button:last-of-type {
        margin-left: 8px;
    }
`;

interface SimpleFormProps {
    children: React.ReactNode;
    "data-testid"?: string;
    noElevation?: boolean;
    className?: string;
}
export const SimpleForm: React.FC<SimpleFormProps> = props => {
    return (
        <SimpleFormContainer
            className={classNames("webiny-data-list", props.className)}
            data-testid={props["data-testid"]}
        >
            {props.noElevation ? props.children : <Elevation z={1}>{props.children}</Elevation>}
        </SimpleFormContainer>
    );
};

interface SimpleFormHeaderProps {
    title: React.ReactNode;
    icon?: React.ReactElement<any>;
    children?: React.ReactNode;
}
export const SimpleFormHeader: React.FC<SimpleFormHeaderProps> = props => {
    return (
        <Grid className={header}>
            <Cell span={props.children ? 6 : 12} className={title}>
                <React.Fragment>
                    {props.icon && <Icon className={icon} icon={props.icon} />}
                    <Typography use="headline5">{props.title}</Typography>
                </React.Fragment>
            </Cell>
            {props.children && (
                <Cell span={6} className={actions}>
                    {props.children}
                </Cell>
            )}
        </Grid>
    );
};

interface SimpleFormFooterProps {
    children: React.ReactNode;
    className?: string;
}
export const SimpleFormFooter: React.FC<SimpleFormFooterProps> = props => {
    return <div className={classNames(footer, props.className)}>{props.children}</div>;
};

export const SimpleFormContent: React.FC = props => {
    return props.children as unknown as React.ReactElement;
};
