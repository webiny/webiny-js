import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import _ from "lodash";
import { createComponent } from "webiny-app";
import defaultValue from "./defaultValue";

import styles from "./Slate.scss?prefix=wby-cms-slate-menu";
import Menu from "./Menu";

class SlateEditor extends React.Component {
    constructor(props) {
        super();

        const value = typeof props.value === "string" ? defaultValue(props.value) : props.value;

        this.state = {
            value: Value.fromJSON(value)
        };

        this.onChange = this.onChange.bind(this);
        this.updateMenu = this.updateMenu.bind(this);
        this.menuRef = this.menuRef.bind(this);

        this.plugins = [];
    }

    componentDidMount() {
        this.updateMenu();
    }

    componentDidUpdate() {
        this.updateMenu();
    }

    onChange(data) {
        this.setState({ value: data.value });

        if (this.update) {
            clearTimeout(this.update);
        }

        this.update = setTimeout(() => {
            const newValue = data.value.toJSON();
            if (!_.isEqual(this.state.value.toJSON(), this.props.value)) {
                this.props.onChange(newValue);
            }
        });
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

    menuRef(menu) {
        this.menu = menu;
    }

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

    render() {
        return (
            <React.Fragment>
                <Menu menuRef={this.menuRef} value={this.state.value} onChange={this.onChange} />
                <div className={styles.editor}>
                    <Editor
                        autoCorrect={false}
                        spellCheck={false}
                        plugins={this.plugins}
                        placeholder="Enter some text..."
                        value={this.state.value}
                        onChange={this.onChange}
                        renderMark={this.renderMark}
                    />
                </div>
            </React.Fragment>
        );
    }
}

export default createComponent(SlateEditor);
