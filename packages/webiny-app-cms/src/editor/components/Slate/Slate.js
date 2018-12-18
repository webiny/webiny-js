// @flow
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, pure } from "recompose";
import { get } from "lodash";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "webiny-plugins";
import { focusSlateEditor, blurSlateEditor } from "webiny-app-cms/editor/actions";
import { withCms } from "webiny-app-cms/context";
import { createValue } from "./index";

import Menu from "./Menu";

class SlateEditor extends React.Component<*, *> {
    static defaultProps = {
        exclude: []
    };

    plugins = [];
    editor = React.createRef();

    constructor(props) {
        super();

        const value = typeof props.value === "string" ? createValue(props.value) : props.value;

        this.state = {
            modified: false,
            showMenu: false,
            value: Value.fromJSON(value),
            readOnly: !props.onChange,
            activePlugin: null
        };

        this.plugins = getPlugins("cms-slate-editor")
            .filter(pl => !props.exclude.includes(pl.name))
            .map(pl => pl.slate);
    }

    static getDerivedStateFromProps(props, state) {
        if (!state.modified && !props.readOnly) {
            // Got new editor value through props.
            const value = typeof props.value === "string" ? createValue(props.value) : props.value;
            return {
                value: Value.fromJSON(value)
            };
        }

        return null;
    }

    onChange = change => {
        if (this.state.readOnly) {
            return;
        }

        // Prevent `onChange` if it is a `set_value` operation.
        // We only need to handle changes on user input.
        if (get(change.operations.toJSON(), "0.type") === "set_value") {
            return;
        }

        // Only update local state.
        this.setState(state => ({
            ...state,
            value: change.value,
            modified: true
        }));
    };

    onBlur = () => {
        this.setState({ modified: false });
        this.props.onChange(this.state.value.toJSON());
    };

    onFocus = () => {
        if (this.state.activePlugin) {
            this.setState({ activePlugin: null });
        }

        Array.isArray(Menu.menus) && Menu.menus.forEach(cb => cb());
    };

    getMenuContainer = () => {
        const id = "slate-menu-container";

        // Get menu container
        let menuContainer = document.getElementById(id);
        if (!menuContainer) {
            menuContainer = document.createElement("div");
            menuContainer.setAttribute("id", id);
            document.body && document.body.appendChild(menuContainer);
        }

        // Position menu container
        const rect = this.getSelectionRect();
        menuContainer.style.position = "absolute";
        menuContainer.style.top = rect.top + "px";
        menuContainer.style.left = rect.left + "px";
        menuContainer.style.width = rect.width + "px";
        menuContainer.style.height = rect.height + "px";

        return menuContainer;
    };

    getSelectionRect = () => {
        const native = window.getSelection();
        if (native.type === "None") {
            return { top: 0, left: 0, width: 0, height: 0 };
        }

        const range = native.getRangeAt(0);
        return range.getBoundingClientRect();
    };

    renderFloatingMenu = () => {
        const container = this.getMenuContainer();

        if (container) {
            return ReactDOM.createPortal(
                <Menu
                    exclude={this.props.exclude}
                    value={this.state.value}
                    onChange={this.onChange}
                    editor={this.editor}
                />,
                container
            );
        }

        return null;
    };

    render() {
        return (
            <React.Fragment>
                {!this.state.readOnly && this.renderFloatingMenu()}
                <Editor
                    ref={this.editor}
                    onBlur={this.onBlur}
                    onFocus={this.onFocus}
                    readOnly={this.state.readOnly}
                    autoCorrect={false}
                    spellCheck={false}
                    plugins={this.plugins}
                    placeholder="Enter some text..."
                    value={this.state.value}
                    onChange={this.onChange}
                    theme={this.props.cms.theme}
                />
            </React.Fragment>
        );
    }
}

export default pure(
    compose(
        connect(
            null,
            { focusSlateEditor, blurSlateEditor }
        ),
        withCms()
    )(SlateEditor)
);
