import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class View extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            show: false,
            data: null
        };

        this.bindMethods('show');
    }

    componentWillMount() {
        super.componentWillMount();

        if (this.props.attachView) {
            this.props.attachView(this);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
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
            this.setState({show: true, data});
        });
    }

    hide() {
        if (this.props.modal && this.state.show) {
            return this.view.hide();
        }

        if (this.state.show) {
            this.setState({show: false, data: null});
        }

        return Promise.resolve(true);
    }
}

View.defaultProps = {
    view: null,
    defaultView: false,
    modal: false,
    renderer() {
        if (this.state.show) {
            const params = {
                showView: this.props.container.showView,
                data: this.state.data
            };

            const view = this.props.children(params);
            if (!view) {
                return null;
            }

            const props = {ref: ref => this.view = ref};
            if (this.props.modal) {
                // onComponentDidMount is a special callback that will be executed once the actual component is mounted
                // We need access to the actual mounted instance of component and not the proxy ComponentWrapper
                props.onComponentDidMount = (instance) => {
                    instance.show().then(this.showResolve || _.noop);
                };
                props.onHidden = () => {
                    this.setState({show: false, data: null});
                };
            }
            return React.cloneElement(view, props);
        }
        return null;
    }
};

export default Webiny.createComponent(View, {api: ['show', 'hide', 'isShown']});
