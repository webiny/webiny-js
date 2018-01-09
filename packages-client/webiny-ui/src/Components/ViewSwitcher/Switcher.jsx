import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import View from './View';

class Switcher extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.views = {};
        this.defaultView = null;
        this.viewProps = {
            container: this,
            attachView: view => {
                this.views[view.props.view] = view;
            },
            detachView: view => {
                delete this.views[view.props.view];
            }
        };

        this.bindMethods('showView,renderView');
    }

    componentDidMount() {
        super.componentDidMount();
        if (this.defaultView) {
            this.views[this.defaultView].show();
        }
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
        if (Webiny.isElementOfType(view, View)) {
            if (view.props.defaultView) {
                this.defaultView = view.props.view;
            }
            return React.cloneElement(view, _.assign({}, this.viewProps, {key: view.props.view}));
        }
        return null;
    }
}

Switcher.defaultProps = {
    renderer() {
        return (
            <webiny-view-switcher>{React.Children.map(this.props.children, this.renderView)}</webiny-view-switcher>
        );
    }
};

export default Webiny.createComponent(Switcher);
