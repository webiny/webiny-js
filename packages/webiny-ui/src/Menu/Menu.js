// @flow
import * as React from "react";
import ReactDOM from "react-dom";
import {
    Menu as BaseMenu,
    MenuItem,
    MenuSurface,
    MenuSurfaceAnchor,
    type SelectedEventDetailT
} from "@rmwc/menu";
import type { CustomEventT } from "@rmwc/base";
import { List } from "webiny-ui/List";

type Props = {
    // One or more MenuItem components.
    children: React.ChildrenArray<React.Element<typeof MenuItem> | React.Element<typeof List>>,

    // A handler which triggers the menu, eg. button or link.
    handle?: React.Node,

    onSelect?: (evt: CustomEventT<SelectedEventDetailT>) => mixed,

    // Position the menu to one of anchor corners.
    // 'bottomEnd' | 'bottomLeft' | 'bottomRight' | 'bottomStart' | 'topEnd' | 'topLeft' | 'topRight' | 'topStart'
    anchor?:
        | "bottomEnd"
        | "bottomLeft"
        | "bottomRight"
        | "bottomStart"
        | "topEnd"
        | "topLeft"
        | "topRight"
        | "topStart",

    // Class that will be added to the Menu element.
    className?: string
};

type State = {
    menuIsOpen: boolean
};

let el = null;
const getElement = () => {
    if (!el) {
        el = document.createElement("div");
        el.id = "menu-container";
        // $FlowFixMe
        document.body.appendChild(el);
    }

    return el;
};

/**
 * Use Menu component to display a list of choices, once the handler is triggered.
 */
class Menu extends React.Component<Props, State> {
    static defaultProps = {
        handle: null,
        anchor: "topStart"
    };

    state = {
        menuIsOpen: false
    };

    anchorRef = React.createRef();
    menuRef = React.createRef();

    componentDidUpdate() {
        if (!this.menuRef.current || !this.anchorRef.current) {
            return;
        }

        const menu = this.menuRef.current;
        const anchorRect = this.anchorRef.current.getBoundingClientRect();

        menu.style.position = "absolute";
        menu.style.left = anchorRect.left - 60 + "px";
        menu.style.top = anchorRect.top + "px";
    }

    renderMenuWithPortal = () => {
        return ReactDOM.createPortal(
            <div ref={this.menuRef}>
                <BaseMenu
                    anchorCorner={this.props.anchor}
                    open={this.state.menuIsOpen}
                    className={this.props.className}
                    onClose={() => this.setState({ menuIsOpen: false })}
                    onSelect={this.props.onSelect}
                >
                    {this.props.children}
                </BaseMenu>
            </div>,
            getElement()
        );
    };

    renderCustomContent = () => {
        return (
            <MenuSurface
                open={this.state.menuIsOpen}
                onClose={() => this.setState({ menuIsOpen: false })}
            >
                {this.props.children}
            </MenuSurface>
        );
    };

    renderMenuContent = () => {
        return Array.isArray(this.props.children)
            ? this.renderMenuWithPortal()
            : this.renderCustomContent();
    };

    render() {
        return (
            <MenuSurfaceAnchor elementRef={this.anchorRef}>
                {this.renderMenuContent()}
                {this.props.handle &&
                    /* $FlowFixMe */
                    React.cloneElement(this.props.handle, {
                        onClick: () => this.setState({ menuIsOpen: true })
                    })}
            </MenuSurfaceAnchor>
        );
    }
}

const MenuDivider = () => {
    return <li className="mdc-list-divider" role="separator" />;
};

export { Menu, MenuItem, MenuDivider };
