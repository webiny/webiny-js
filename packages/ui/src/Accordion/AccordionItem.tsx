import React, { useState, useCallback, useEffect } from "react";
import { ListItem, ListItemGraphic, ListItemMeta } from "../List";
import Transition from "react-transition-group/Transition";
import { Icon } from "~/Icon";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Typography } from "~/Typography";

import { ReactComponent as UpArrow } from "./icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownArrow } from "./icons/round-keyboard_arrow_down-24px.svg";
import classNames from "classnames";

const Content = styled("div")({
    width: "100%",
    borderRight: "1px solid var(--mdc-theme-background)",
    borderBottom: "1px solid var(--mdc-theme-background)",
    borderLeft: "1px solid var(--mdc-theme-background)",
    boxSizing: "border-box"
});

const listItem = css({
    padding: "15px 20px",
    cursor: "pointer",
    borderBottom: "1px solid var(--mdc-theme-background)",
    "&:last-child": {
        borderBottom: "none"
    },
    ".mdc-list-item__graphic": {
        marginRight: 20
    }
});

const ListItemTitle = styled("div")({
    fontWeight: 600,
    marginBottom: 5
});

const ListItemDescription = styled("div")({});

const TitleContent = styled("div")({
    display: "flex",
    flexDirection: "column"
});

const openedState = css({
    backgroundColor: "var(--mdc-theme-on-background)"
});

const duration = 150;
const defaultStyle = {
    transition: `all ${duration}ms ease-in-out`,
    opacity: 0,
    height: 0,
    pointerEvents: "none",
    overflow: "hidden"
};

type TransitionStylesState = "entering" | "entered" | "exiting";

/**
 * We are casting pointerEvents as any because csstype does not have PointerEvents exported. Or at least, that is the error.
 */
const transitionStyles = {
    entering: {
        opacity: 0,
        height: 0,
        padding: "20px 20px 20px 65px",
        pointerEvents: "auto" as any,
        overflow: "initial"
    },
    entered: {
        opacity: 1,
        height: "auto",
        padding: "20px 20px 20px 65px",
        pointerEvents: "auto" as any,
        overflow: "initial"
    },
    exiting: {
        height: "auto",
        padding: "20px 20px 20px 65px",
        pointerEvents: "auto" as any,
        overflow: "initial"
    }
};

export interface AccordionItemProps {
    /**
     * Left side icon
     */
    icon?: React.ReactElement | null;

    /**
     * Accordion title
     */
    title?: React.ReactNode;

    /**
     * Optional description
     */
    description?: string;

    /**
     * Append a class name
     */
    className?: string;

    /**
     * Render item opened by default
     */
    open?: boolean;
    /**
     * For testing purpose
     */
    "data-testid"?: string;
    /**
     * Append a class name to Icon
     */
    iconClassName?: string;
}

const AccordionItem: React.FC<AccordionItemProps> = props => {
    const [open, setState] = useState<boolean>(props.open ? props.open : false);

    const toggleState = useCallback(() => {
        setState(!open);
    }, [open]);

    useEffect(() => {
        setState(props.open ? true : false);
    }, [props.open]);

    return (
        <div className={classNames("webiny-ui-accordion-item", props.className)}>
            <ListItem
                className={classNames(
                    listItem,
                    { [openedState]: open },
                    "webiny-ui-accordion-item__list-item"
                )}
                onClick={toggleState}
                data-testid={props["data-testid"]}
            >
                {props.icon && (
                    <ListItemGraphic>
                        <Icon icon={props.icon} className={props.iconClassName} />
                    </ListItemGraphic>
                )}

                <TitleContent className="webiny-ui-accordion-item__title">
                    <ListItemTitle>{props.title}</ListItemTitle>
                    {props.description && (
                        <ListItemDescription>
                            <Typography use={"subtitle2"}>{props.description}</Typography>
                        </ListItemDescription>
                    )}
                </TitleContent>
                <ListItemMeta>
                    <Icon icon={!open ? <DownArrow /> : <UpArrow />} />
                </ListItemMeta>
            </ListItem>
            <Transition in={open} timeout={duration}>
                {(state: TransitionStylesState) => (
                    <Content
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                        className="webiny-ui-accordion-item__content"
                    >
                        {props.children}
                    </Content>
                )}
            </Transition>
        </div>
    );
};

export { AccordionItem };
