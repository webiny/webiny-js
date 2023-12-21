import React, { CSSProperties, useCallback, useEffect, useState } from "react";
import { ListItem, ListItemGraphic, ListItemMeta } from "~/List";
import Transition, { TransitionStatus } from "react-transition-group/Transition";
import { Icon } from "~/Icon";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Typography } from "~/Typography";
import { ReactComponent as UpArrow } from "./icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownArrow } from "./icons/round-keyboard_arrow_down-24px.svg";
import classNames from "classnames";
import {
    AccordionItemAction,
    AccordionItemActions,
    AccordionItemElement
} from "~/Accordion/AccordionItemActions";

const Content = styled.div`
    width: 100%;
    border-right: 1px solid var(--mdc-theme-background);
    border-bottom: 1px solid var(--mdc-theme-background);
    border-left: 1px solid var(--mdc-theme-background);
    box-sizing: border-box;
    > .mdc-layout-grid {
        margin: -24px;
    }
`;

const listItem = css`
    cursor: pointer;
    border-bottom: 1px solid var(--mdc-theme-background);
    &:last-child {
        border-bottom: none;
    }
    .mdc-list-item__graphic {
        margin-right: 20px;
    }
`;

const ListItemTitle = styled.div`
    font-weight: 600;
    line-height: 100%;
`;

const ListItemDescription = styled.div`
    line-height: 100%;
`;

const TitleContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const openedState = css`
    background-color: var(--mdc-theme-on-background);
`;

const nonInteractive = css`
    background-color: var(--mdc-theme-surface);
`;

const duration = 150;
const defaultStyle: CSSProperties = {
    transition: `all ${duration}ms ease-in-out`,
    opacity: 0,
    height: 0,
    pointerEvents: "auto",
    overflow: "hidden"
};

const transitionStyles: Record<string, CSSProperties> = {
    entering: {
        opacity: 0,
        height: 0,
        padding: "20px",
        pointerEvents: "auto",
        overflow: "initial"
    },
    entered: {
        opacity: 1,
        height: "auto",
        padding: "20px",
        pointerEvents: "auto",
        overflow: "initial"
    },
    exiting: {
        height: "auto",
        padding: "20px",
        pointerEvents: "auto",
        overflow: "initial"
    }
};

const Divider = styled.span`
    width: 1px;
    margin: 0 15px;
    height: 100%;
    background-color: var(--mdc-theme-on-background);
`;

const Actions = styled(ListItemMeta)`
    display: flex;
    height: 40%;
    align-items: center;
`;

export interface AccordionItemProps {
    /**
     * Can user toggle the accordion item by clicking it? Defaults to `true`.
     */
    interactive?: boolean;
    /**
     * Actions to show on the right side of the accordion item
     */
    actions?: React.ReactElement | null;
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

    children: React.ReactNode;
}

const AccordionItemComponent = (props: AccordionItemProps) => {
    const [open, setState] = useState<boolean>(props.open ? props.open : false);
    const { interactive = true, actions } = props;

    const toggleState = useCallback(() => {
        setState(!open);
    }, [open]);

    const onClick = interactive ? toggleState : undefined;
    const divider = interactive && actions ? <Divider /> : null;
    const arrowIcon = interactive ? <Icon icon={!open ? <DownArrow /> : <UpArrow />} /> : null;

    useEffect(() => {
        setState(!!props.open);
    }, [props.open]);

    return (
        <div className={classNames("webiny-ui-accordion-item", props.className)}>
            <ListItem
                disabled={!interactive}
                className={classNames(
                    listItem,
                    { [openedState]: open },
                    { [nonInteractive]: !interactive },
                    "webiny-ui-accordion-item__list-item"
                )}
                onClick={onClick}
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
                            <Typography use={"body2"}>{props.description}</Typography>
                        </ListItemDescription>
                    )}
                </TitleContent>
                <Actions>
                    {props.actions ? props.actions : null}
                    {divider}
                    {arrowIcon}
                </Actions>
            </ListItem>
            <Transition in={open} timeout={duration}>
                {(state: TransitionStatus) => (
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

type AccordionItem = React.ComponentType<AccordionItemProps> & {
    Divider: typeof Divider;
    Actions: typeof AccordionItemActions;
    Action: typeof AccordionItemAction;
    Element: typeof AccordionItemElement;
};

export const AccordionItem: AccordionItem = Object.assign(AccordionItemComponent, {
    Divider,
    Action: AccordionItemAction,
    Actions: AccordionItemActions,
    Element: AccordionItemElement
});
