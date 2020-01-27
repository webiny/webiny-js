import * as React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { AccordionItem } from "./AccordionItem";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";
import classNames from "classnames";

export type AccordionProps = {
    /**
     * Element displayed when accordion is expanded.
     */
    children: React.ReactElement<typeof ListItem>[] | React.ReactElement<typeof AccordionItem>[];

    /**
     * Elevation number, default set to 2
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;
};

const listStyle = css({
    "&.mdc-list": {
        padding: 0
    }
});

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
