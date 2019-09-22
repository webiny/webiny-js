// @flow
import * as React from "react";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { Transition } from "react-transition-group";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DownIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_down-24px.svg";
import { ReactComponent as UpIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_up-24px.svg";
import useNavigation from "./useNavigation";
import classNames from "classnames";
import { css } from "emotion";

const defaultStyle = {
    transform: "translateY(-20px)",
    opacity: 0,
    transitionProperty: "transform, opacity",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "100ms",
    willChange: "opacity, transform"
};

const transitionStyles = {
    entering: { transform: "translateY(-20px)", opacity: 0 },
    entered: { transform: "translateY(0px)", opacity: 1 }
};

const menuTitle = css({
    ".mdc-drawer &.mdc-list": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        padding: 0,
        ".mdc-list-item": {
            margin: 0,
            padding: "0 15px",
            height: "auto",
            width: "100%",
            fontWeight: "600",
            boxSizing: "border-box"
        }
    }
});

const menuTitleActive = css({
    backgroundColor: "var(--mdc-theme-background)"
});

type Props = { name: string, label: React.Node, icon: string, children: React.Node };

export default function Menu(props: Props) {
    const { name } = props;
    const { sectionIsExpanded, toggleSection } = useNavigation();

    const sectionExpanded = sectionIsExpanded(name);

    return (
        <>
            <List className={classNames(menuTitle, { [menuTitleActive]: sectionExpanded })}>
                <ListItem onClick={() => toggleSection(name)}>
                    {props.icon && (
                        <ListItemGraphic>
                            <IconButton icon={props.icon} />
                        </ListItemGraphic>
                    )}

                    {props.label}
                    <ListItemMeta>
                        <IconButton icon={sectionExpanded ? <UpIcon /> : <DownIcon />} />
                    </ListItemMeta>
                </ListItem>
            </List>
            <Transition in={sectionExpanded} timeout={100} appear unmountOnExit>
                {state => (
                    <div style={{ ...defaultStyle, ...transitionStyles[state] }}>
                        {props.children}
                    </div>
                )}
            </Transition>
        </>
    );
}
