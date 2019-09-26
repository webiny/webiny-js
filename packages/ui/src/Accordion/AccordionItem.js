//@flow
import * as React from "react";
import { ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import Transition from "react-transition-group/Transition";
import { Icon } from "@webiny/ui/Icon";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";

import { ReactComponent as UpArrow } from "./icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownArrow } from "./icons/round-keyboard_arrow_down-24px.svg";
import classNames from "classnames";

const Content = styled("div")({
    width: "100%",
    borderBottom: "1px solid var(--mdc-theme-background)",
    boxSizing: "border-box",
    padding: "20px 20px 20px 65px"
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
    opacity: 0
};

const transitionStyles = {
    entering: { opacity: 0 },
    entered: { opacity: 1 }
};

type State = {
    closed: boolean
};

type Props = {
    // Left side icon.
    icon: React.Element<any>,

    // Accordion title.
    title?: React.Node,

    // Optional description
    description?: string,

    // Element displayed when accordion is expanded.
    children?: React.Node,

    // Append a class name
    className?: string
};

class AccordionItem extends React.Component<Props, State> {
    state = { closed: true };

    render() {
        return (
            <div className={classNames("webiny-ui-accordion-item", this.props.className)}>
                <ListItem
                    className={classNames(
                        listItem,
                        { [openedState]: !this.state.closed },
                        "webiny-ui-accordion-item__list-item"
                    )}
                    onClick={() => {
                        this.setState({ closed: !this.state.closed });
                    }}
                >
                    {this.props.icon && (
                        <ListItemGraphic>
                            <Icon icon={this.props.icon} />
                        </ListItemGraphic>
                    )}

                    <TitleContent className="webiny-ui-accordion-item__title">
                        <ListItemTitle>{this.props.title}</ListItemTitle>
                        {this.props.description && (
                            <ListItemDescription>
                                <Typography use={"subtitle2"}>{this.props.description}</Typography>
                            </ListItemDescription>
                        )}
                    </TitleContent>
                    <ListItemMeta>
                        <Icon icon={this.state.closed ? <DownArrow /> : <UpArrow />} />
                    </ListItemMeta>
                </ListItem>
                <Transition in={!this.state.closed} timeout={duration} unmountOnExit>
                    {state => (
                        <Content
                            style={{ ...defaultStyle, ...transitionStyles[state] }}
                            className="webiny-ui-accordion-item__content"
                        >
                            {this.props.children}
                        </Content>
                    )}
                </Transition>
            </div>
        );
    }
}

export { AccordionItem };
