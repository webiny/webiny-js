import React from "react";
import { List, ListItem } from "../List";
import { AccordionItem } from "./AccordionItem";
import { Elevation } from "../Elevation";
import { css } from "emotion";
import classNames from "classnames";

export interface AccordionProps {
    /**
     * Element displayed when accordion is expanded.
     */
    children:
        | React.ReactElement<typeof ListItem>[]
        | React.ReactElement<typeof AccordionItem>
        | React.ReactElement<typeof AccordionItem>[];

    /**
     * Elevation number, default set to 2
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;
}

const listStyle = css`
    &.mdc-deprecated-list {
        padding: 0;
        &.mdc-deprecated-list--two-line .mdc-deprecated-list-item {
            height: 48px;
            padding: 8px 20px;
        }
    }
`;

const Accordion = (props: AccordionProps) => {
    const { children, elevation = 2, className, ...other } = props;
    return (
        <Elevation z={elevation} className={classNames("webiny-ui-accordion", className)}>
            <List twoLine className={listStyle} {...other}>
                {children}
            </List>
        </Elevation>
    );
};

export { Accordion };
