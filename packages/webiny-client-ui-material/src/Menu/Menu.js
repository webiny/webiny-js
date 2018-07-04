// @flow
import * as React from "react";
import { Menu as BaseMenu, MenuItem, MenuAnchor } from "rmwc/Menu";

type Props = {
    // One or more Menu.Item components.
    children: React.ChildrenArray<React.Element<typeof MenuItem>>,
    // A handler which triggers the menu, eg. button or link.
    handle?: React.Node
};

type State = {
    menuIsOpen: boolean
};

MenuItem.displayName = "Menu.Item";

class Menu extends React.Component<Props, State> {
    static Item = MenuItem;

    static defaultProps = {
        handle: null
    };

    state = {
        menuIsOpen: false
    };
    render() {
        return (
            <MenuAnchor>
                <BaseMenu
                    open={this.state.menuIsOpen}
                    onClose={() => this.setState({ menuIsOpen: false })}
                >
                    {this.props.children}
                </BaseMenu>
                {this.props.handle &&
                    // $FlowFixMe
                    React.cloneElement(this.props.handle, {
                        onClick: () => {
                            this.setState({ menuIsOpen: true });
                        }
                    })}
            </MenuAnchor>
        );
    }
}

export default Menu;
