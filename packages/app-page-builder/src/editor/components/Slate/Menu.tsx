import React, { ReactElement, SyntheticEvent } from "react";
import { Transition } from "react-transition-group";
import { getPlugins } from "@webiny/plugins";
import { css } from "emotion";
import { Elevation } from "@webiny/ui/Elevation";
import { hoverMenuStyle, defaultStyle, transitionStyles } from "./styled";
import { PbEditorSlateMenuItemPlugin } from "@webiny/app-page-builder/types";

export type MenuButtonProps = {
    onClick?: (e: SyntheticEvent) => void;
    active?: boolean;
    children: ReactElement;
    onMouseDown?: (e: SyntheticEvent) => void;
};

const MenuButton: React.FC<MenuButtonProps> = ({
    onClick,
    active,
    children,
    onMouseDown = e => e.preventDefault()
}) => {
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

class Menu extends React.Component<any> {
    static menus = [];
    menu = React.createRef();

    componentDidUpdate() {
        const menu = this.menu.current as HTMLElement;
        if (!menu) {
            return;
        }

        // @ts-ignore
        const rect = menu.parentNode.getBoundingClientRect() as ClientRect;
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

    renderPlugins = () => {
        const { value, onChange, editor, exclude } = this.props;
        const plugins = getPlugins("pb-editor-slate-menu-item") as PbEditorSlateMenuItemPlugin[];
        return plugins
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
                            ref={this.menu}
                            className={hoverMenuStyle}
                            style={{ ...defaultStyle, ...transitionStyles[state] }}
                        >
                            {this.renderPlugins()}
                        </Elevation>
                    </React.Fragment>
                )}
            </Transition>
        );
    }
}

export default Menu;
