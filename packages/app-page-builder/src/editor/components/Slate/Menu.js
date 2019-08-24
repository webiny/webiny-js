// @flow
import React from "react";
import { Transition } from "react-transition-group";
import { getPlugins } from "@webiny/plugins";
import { css } from "emotion";
import { Elevation } from "@webiny/ui/Elevation";
import { hoverMenuStyle, defaultStyle, transitionStyles } from "./styled";

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

class Menu extends React.Component<*, *> {
    static menus = [];
    menu = React.createRef();

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

    renderPlugins = (type: string) => {
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
                        activatePlugin: this.props.activatePlugin
                    }),
                    {
                        key: plugin.name
                    }
                );
            });
    };

    render() {
        const { selection } = this.props.value;

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
                            {this.renderPlugins("pb-editor-slate-menu-item")}
                        </Elevation>
                    </React.Fragment>
                )}
            </Transition>
        );
    }
}

export default Menu;