import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";

@inject({ modules: ["Link"] })
class ModalMultiAction extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modal: null
        };
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

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
                this.setState({ modal });
            }
        };

        const { modules: { Link } } = this.props;

        const dialogProps = {
            onReady: dialog => {
                this.dialog = dialog;
                dialog.show();
            },
            // `dialog` is passed from Component.js as `this` of the mounted dialog itself
            onHidden: () => {
                this.dialog = null;
                this.setState({ modal: null });
            }
        };

        return (
            <Link onClick={onAction}>
                {this.state.modal ? React.cloneElement(this.state.modal, dialogProps) : null}
                {this.props.label}
            </Link>
        );
    }
}

ModalMultiAction.defaultProps = {
    actions: null,
    label: null,
    data: null,
    hide: _.noop
};

export default ModalMultiAction;
