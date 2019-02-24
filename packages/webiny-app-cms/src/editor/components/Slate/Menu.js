// @flow
import React from "react";
import { compose, lifecycle } from "recompose";
import { Transition } from "react-transition-group";
import { getPlugins, getPlugin } from "webiny-plugins";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { css } from "emotion";
import { Elevation } from "webiny-ui/Elevation";
import { hoverMenuStyle, defaultStyle, ToolbarBox, transitionStyles, Overlay } from "./styled";

const MenuButton = ({ onClick, active, children, onMouseDown = e => e.preventDefault() }) => {
    const buttonStyle = css({
        cursor: "pointer",
        color: active
            ? "var(--mdc-theme-primary)"
            : "var(--mdc-theme-text-secondary-on-background)",
        "&:hover": {
            color: "var(--mdc-theme-primary)"
        }
    });

    return (
        <span onClick={onClick} className={buttonStyle} onMouseDown={onMouseDown}>
            {children}
        </span>
    );
};

const MenuContainer = compose(
    withKeyHandler(),
    lifecycle({
        componentDidMount() {
            this.props.addKeyHandler("escape", e => {
                e.preventDefault();
                this.props.closeMenu();
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("escape");
        }
    })
)(({ children }) => {
    return children;
});

class Menu extends React.Component<*, *> {
    static menus = [];
    menu = React.createRef();

    state = {
        activePlugin: null,
        visible: false
    };

    static getDerivedStateFromProps(props, state) {
        if (!state.activePlugin || !props.value.selection) {
            return null;
        }

        const selection = props.value.selection.toJSON();
        if (state.activePlugin && selection.isFocused && !state.lastSelectionWasFocused) {
            return { activePlugin: null };
        }

        return { lastSelectionWasFocused: selection.isFocused };
    }

    componentDidUpdate() {
        const menu = this.menu.current;
        if (!menu) {
            return;
        }

        const rect = menu.parentNode.getBoundingClientRect();
        let menuLeft = window.pageXOffset - (menu.offsetWidth - rect.width) / 2;
        const absoluteMenuLeft = Math.abs(rect.left + menuLeft);

        // Check left border
        if (absoluteMenuLeft < 65) {
            menuLeft = -(rect.left - 65);
        }

        // Check right border
        const absoluteMenuRight = absoluteMenuLeft + menu.offsetWidth;
        if (absoluteMenuRight > window.innerWidth) {
            menuLeft -= absoluteMenuRight - window.innerWidth + 15;
        }

        menu.style.left = `${menuLeft}px`;
    }

    activatePlugin = plugin => {
        const { value } = this.props;
        const jsonValue = {
            selection: value.selection.toJSON(),
            inlines: value.inlines.toJSON(),
            marks: value.marks.toJSON(),
            activeMarks: value.activeMarks.toJSON(),
            blocks: value.blocks.toJSON(),
            texts: value.texts.toJSON()
        };

        this.setState({ visible: true }, () => {
            setTimeout(() => {
                this.setState({
                    lastSelectionWasFocused: true,
                    activePlugin: { plugin, value: jsonValue }
                });
            }, 200);
        });

        Menu.menus.push(() => {
            this.deactivatePlugin();
        });
    };

    deactivatePlugin = () => {
        this.setState({ visible: false }, () => {
            setTimeout(() => {
                this.setState({ activePlugin: null });
            }, 100);
        });
    };

    renderActivePlugin = () => {
        const { plugin, value } = this.state.activePlugin;
        const menuPlugin = getPlugin(plugin);

        return (
            <Transition in={this.state.visible} timeout={100} appear={true} mountOnEnter={true}>
                {state => (
                    <React.Fragment>
                        <ToolbarBox
                            innerRef={this.menu}
                            style={{ ...defaultStyle, ...transitionStyles[state] }}
                        >
                            <Elevation z={2} className={"elevationBox"}>
                                <MenuContainer closeMenu={this.deactivatePlugin}>
                                    {menuPlugin.renderMenu({
                                        closeMenu: this.deactivatePlugin,
                                        value,
                                        onChange: this.props.onChange,
                                        editor: this.props.editor.current
                                    })}
                                </MenuContainer>
                            </Elevation>
                        </ToolbarBox>
                        <Overlay onClick={this.deactivatePlugin} />
                    </React.Fragment>
                )}
            </Transition>
        );
    };

    renderPlugins = type => {
        const { value, onChange, editor, exclude } = this.props;
        return getPlugins(type)
            .filter(pl => !exclude.includes(pl.name))
            .map(plugin => {
                return React.cloneElement(
                    plugin.render({
                        MenuButton,
                        value,
                        onChange,
                        editor: editor.current,
                        activatePlugin: this.activatePlugin
                    }),
                    {
                        key: plugin.name
                    }
                );
            });
    };

    render() {
        const { selection } = this.props.value;

        if (this.state.activePlugin) {
            return this.renderActivePlugin();
        }

        if (selection.isFocused && selection.isCollapsed) {
            return null;
        }

        if (!selection.isFocused) {
            return null;
        }

        return (
            <Transition in={Boolean(this.menu)} timeout={200} appear={true}>
                {state => (
                    <React.Fragment>
                        <Elevation
                            z={1}
                            elementRef={this.menu}
                            className={hoverMenuStyle}
                            style={{ ...defaultStyle, ...transitionStyles[state] }}
                        >
                            {this.renderPlugins("cms-slate-menu-item")}
                        </Elevation>
                    </React.Fragment>
                )}
            </Transition>
        );
    }
}

export default Menu;
