import React from 'react';
import _ from 'lodash';
import Webiny from './../../Webiny';
import Component from './Component'; // Need to import this file directly because at this point `Webiny` is not fully populated

class ModalComponent extends Component {

    constructor(props) {
        super(props);
        this.bindMethods('show,hide,renderDialog');
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (DEVELOPMENT && Webiny.isHotReloading()) {
            return true;
        }
        const omitProps = ['renderer', 'renderDialog'];
        const newProps = _.omit(nextProps, omitProps);
        const oldProps = _.omit(this.props, omitProps);
        return !_.isEqual(newProps, oldProps) || !_.isEqual(nextState, this.state);
    }

    // This method is used to get reference to dialog instance. It can be overridden in child classes for more complex scenarios.
    getDialog() {
        return this.dialog;
    }

    hide() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const ref = this.getDialog();
                if (ref) {
                    clearInterval(interval);
                    resolve(ref.hide());
                }
            }, 30);
        });
    }

    show() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const ref = this.getDialog();
                if (ref) {
                    clearInterval(interval);
                    resolve(ref.show());
                }
            }, 30);
        });
    }

    isAnimating() {
        return this.getDialog().isAnimating();
    }

    renderDialog() {
        if (_.isFunction(this.props.renderDialog)) {
            return this.props.renderDialog.call(this, {dialog: this});
        }

        throw new Error('Implement renderDialog() method in your modal component class or add a renderDialog() function through props!');
    }
}

ModalComponent.defaultProps = Component.extendProps({
    renderDialog: null,
    renderer() {
        const dialog = this.renderDialog();
        const props = {ref: dialog => this.dialog = dialog};
        if (this.props.onHidden) {
            props['onHidden'] = this.props.onHidden;
        }
        return React.cloneElement(dialog, props);
    }
});

export default ModalComponent;
