import React from 'react';
import _ from 'lodash';
import { app, createComponent } from 'webiny-client';

class View extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            show: false,
            data: null
        };

        this.show = this.show.bind(this);
    }

    componentWillMount() {
        if (this.props.attachView) {
            this.props.attachView(this);
        }
    }

    componentWillUnmount() {
        if (this.props.detachView) {
            this.props.detachView(this);
        }
    }

    isShown() {
        return this.state.show;
    }

    show(data) {
        return new Promise(resolve => {
            this.showResolve = resolve;
            this.setState({ show: true, data });
        });
    }

    hide() {
        if (this.props.modal && this.state.show) {
            return this.view.hide();
        }

        if (this.state.show) {
            this.setState({ show: false, data: null });
        }

        return Promise.resolve(true);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (this.state.show) {
            const params = {
                showView: this.props.container.showView,
                data: this.state.data
            };

            const view = this.props.children(params);
            if (!view) {
                return null;
            }

            const props = { ref: ref => this.view = ref };
            if (this.props.modal) {
                const dialogName = view.props.name;
                // We need access to the actual mounted instance of component and not the proxy ComponentWrapper
                props.onReady = () => {
                    app.services.get('modal').show(dialogName).then(this.showResolve || _.noop);
                };
                props.onHidden = () => {
                    this.setState({ show: false, data: null });
                };
            }
            return React.cloneElement(view, props);
        }
        return null;
    }
}

View.defaultProps = {
    view: null,
    defaultView: false,
    modal: false
};

export default createComponent(View);
