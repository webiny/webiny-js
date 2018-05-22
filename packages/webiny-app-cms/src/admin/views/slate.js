import React from "react";
import ReactDOM from "react-dom";
import { Editor } from "slate-react";
import { Value } from "slate";
import { createComponent } from "webiny-app";
import styles from "./slate.scss";
import classSet from "classnames";

/**
 * The menu.
 *
 * @type {Component}
 */

class MenuClass extends React.Component {
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
     * @param {String} type
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

const Menu = createComponent(MenuClass, { modules: ["Icon"] });

const initialValue = Value.fromJSON({
    document: {
        nodes: [
            {
                object: "block",
                type: "paragraph",
                nodes: [
                    {
                        object: "text",
                        leaves: [
                            {
                                text:
                                    "This example shows how you can make a hovering menu appear above your content, which you can use to make text "
                            },
                            {
                                text: "bold",
                                marks: [
                                    {
                                        type: "bold"
                                    }
                                ]
                            },
                            {
                                text: ", "
                            },
                            {
                                text: "italic",
                                marks: [
                                    {
                                        type: "italic"
                                    }
                                ]
                            },
                            {
                                text: ", or anything else you might want to do!"
                            }
                        ]
                    }
                ]
            },
            {
                object: "block",
                type: "paragraph",
                nodes: [
                    {
                        object: "text",
                        leaves: [
                            {
                                text: "Try it out yourself! Just "
                            },
                            {
                                text: "select any piece of text and the menu will appear",
                                marks: [
                                    {
                                        type: "bold"
                                    },
                                    {
                                        type: "italic"
                                    }
                                ]
                            },
                            {
                                text: "."
                            }
                        ]
                    }
                ]
            }
        ]
    }
});

class SlateView extends React.Component {
    constructor() {
        super();
        this.state = {
            value: initialValue
        };

        this.onChange = this.onChange.bind(this);
        this.updateMenu = this.updateMenu.bind(this);
        this.menuRef = this.menuRef.bind(this);
    }

    componentDidMount() {
        this.updateMenu();
    }

    componentDidUpdate() {
        this.updateMenu();
    }

    onChange(data) {
        this.setState({ value: data.value });
    }
    updateMenu() {
        const { value } = this.state;
        const menu = this.menu;
        if (!menu) return;

        if (value.isBlurred || value.isEmpty) {
            menu.removeAttribute("style");
            return;
        }

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        menu.style.opacity = 1;
        menu.style.top = `${rect.top + window.pageYOffset - menu.offsetHeight}px`;
        menu.style.left = `${rect.left +
            window.pageXOffset -
            menu.offsetWidth / 2 +
            rect.width / 2}px`;
    }

    /**
     * Save the `menu` ref.
     *
     * @param {Menu} menu
     */

    menuRef(menu) {
        this.menu = menu;
    }

    /**
     * Render.
     *
     * @return {Element}
     */

    render() {
        return (
            <div>
                <Menu menuRef={this.menuRef} value={this.state.value} onChange={this.onChange} />
                <div className={styles.editor}>
                    <Editor
                        placeholder="Enter some text..."
                        value={this.state.value}
                        onChange={this.onChange}
                        renderMark={this.renderMark}
                    />
                </div>
            </div>
        );
    }

    /**
     * Render a Slate mark.
     *
     * @param {Object} props
     * @return {Element}
     */

    renderMark(props) {
        const { children, mark, attributes } = props;
        switch (mark.type) {
            case "bold":
                return <strong {...attributes}>{children}</strong>;
            case "code":
                return <code {...attributes}>{children}</code>;
            case "italic":
                return <em {...attributes}>{children}</em>;
            case "underlined":
                return <u {...attributes}>{children}</u>;
        }
    }
}

export default SlateView;
