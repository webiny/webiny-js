import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ModalMultiAction extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            modal: null
        };
    }
}

ModalMultiAction.defaultProps = {
    actions: null,
    label: null,
    data: null,
    hide: _.noop,
    renderer() {
        if (_.isFunction(this.props.hide) && this.props.hide(this.props.data)) {
            return null;
        }

        const onAction = () => {
            if (this.props.data.length) {
                const modal = this.props.children.call(this, {
                    data: this.props.data,
                    actions: this.props.actions,
                    dialog: {
                        hide: () => {
                            if (this.dialog) {
                                return this.dialog.hide();
                            }
                            return Promise.resolve(true);
                        }
                    }
                });
                this.setState({modal});
            }
        };

        const {Link} = this.props;

        const dialogProps = {
            ref: ref => this.dialog = ref,
            // `dialog` is passed from Component.js as `this` of the mounted dialog itself
            onComponentDidMount: dialog => dialog.show(),
            onHidden: () => {
                this.dialog = null;
                this.setState({modal: null});
            }
        };

        return (
            <Link onClick={onAction}>
                {this.state.modal ? React.cloneElement(this.state.modal, dialogProps) : null}
                {this.props.label}
            </Link>
        );
    }
};

export default Webiny.createComponent(ModalMultiAction, {modules: ['Link']});