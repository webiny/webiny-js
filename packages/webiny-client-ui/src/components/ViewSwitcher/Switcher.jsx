import React from "react";
import _ from "lodash";
import { Component, isElementOfType } from "webiny-client";
import View from "./View";

@Component()
class Switcher extends React.Component {
    constructor(props) {
        super(props);

        this.views = {};
        this.defaultView = null;
        this.viewProps = {
            container: this,
            attachView: view => {
                this.views[view.props.name] = view;
            },
            detachView: view => {
                delete this.views[view.props.name];
            }
        };

        ["showView", "renderView"].map(m => (this[m] = this[m].bind(this)));
    }

    componentDidMount() {
        if (this.defaultView) {
            this.views[this.defaultView].show();
        }

        this.props.onReady &&
            this.props.onReady({
                showView: this.showView
            });
    }

    showView(name) {
        return (params = {}) => {
            if (params !== undefined && _.isFunction(params.persist)) {
                params = {};
            }

            const nextView = this.views[name];
            if (!nextView) {
                console.warn("Warning: view '" + name + "' was not found in ViewContainer!");
                return Promise.resolve();
            }

            if (!nextView.props.modal) {
                // Hide all currently shown views
                _.each(this.views, view => {
                    if (view.isShown()) {
                        view.hide();
                    }
                });
            }
            return Promise.resolve(nextView.show(params));
        };
    }

    renderView(view) {
        if (isElementOfType(view, View)) {
            if (view.props.defaultView) {
                this.defaultView = view.props.name;
            }
            return React.cloneElement(view, _.assign({}, this.viewProps, { key: view.props.name }));
        }
        return null;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <webiny-view-switcher>
                {React.Children.map(this.props.children, this.renderView)}
            </webiny-view-switcher>
        );
    }
}

export default Switcher;
