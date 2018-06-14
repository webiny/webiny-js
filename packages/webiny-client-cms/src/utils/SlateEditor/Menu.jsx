import React from "react";
import ReactDOM from "react-dom";
import { Component } from "webiny-client";
import classSet from "classnames";
import styles from "./Menu.scss?prefix=wby-cms-slate-menu";

@Component({ modules: ["Icon"] })
class Menu extends React.Component {
    /**
     * Check if the current selection has a mark with `type` in it.
     *
     * @param {String} type
     * @return {Boolean}
     */

    hasMark(type) {
        const { value } = this.props;
        return value.activeMarks.some(mark => mark.type === type);
    }

    /**
     * When a mark button is clicked, toggle the current mark.
     *
     * @param {Event} event
     * @param {String} type
     */

    onClickMark(event, type) {
        const { value, onChange } = this.props;
        event.preventDefault();
        const change = value.change().toggleMark(type);
        onChange(change);
    }

    /**
     * Render a mark-toggling toolbar button.
     *
     * @param {String} types
     * @param {String} icon
     * @return {Element}
     */

    renderMarkButton(type, icon) {
        const isActive = this.hasMark(type);
        const onMouseDown = event => this.onClickMark(event, type);

        return (
            // eslint-disable-next-line react/jsx-no-bind
            <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
                {icon}
            </span>
        );
    }

    /**
     * Render.
     *
     * @return {Element}
     */

    render() {
        const root = window.document.getElementById("root");
        const {
            modules: { Icon }
        } = this.props;

        return ReactDOM.createPortal(
            <div className={classSet(styles.menu, styles["hover-menu"])} ref={this.props.menuRef}>
                {this.renderMarkButton("bold", <Icon icon={"bold"} />)}
                {this.renderMarkButton("italic", <Icon icon={"italic"} />)}
                {this.renderMarkButton("underlined", <Icon icon={"underline"} />)}
                {this.renderMarkButton("code", <Icon icon={"code"} />)}
            </div>,
            root
        );
    }
}

export default Menu;