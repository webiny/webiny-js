//@flow
import * as React from "react";
import { List, ListItem } from "webiny-ui/List";
import { AccordionItem } from "./AccordionItem";
import { Elevation } from "webiny-ui/Elevation";
import { css } from "emotion";

type Props = {
    // Element displayed when accordion is expanded.
    children: React.ChildrenArray<
        React.Element<typeof ListItem> | React.Element<typeof AccordionItem>
    >
};

const listStyle = css({
    "&.mdc-list": {
        padding: 0
    }
});

const Accordion = (props: Props) => {
    return (
        <Elevation z={2}>
            <List twoLine className={listStyle} {...props}>
                {props.children}
            </List>
        </Elevation>
    );
};

export { Accordion };
