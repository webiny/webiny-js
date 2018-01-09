import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ClickSuccess extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {data: {}};
        this.bindMethods('getContent,onClick,hide');
    }

    hide() {
        return this.dialog.hide();
    }

    onClick() {
        return Promise.resolve(this.realOnClick(this)).then(() => {
            return this.dialog.show();
        });
    }

    getContent() {
        const content = this.props.children;
        if (_.isFunction(content)) {
            return content({
                success: ({data}) => {
                    this.setState({data}, () => this.dialog.show());
                }
            });
        }

        const input = React.Children.toArray(content)[0];
        this.realOnClick = input.props.onClick;
        const props = _.omit(input.props, ['onClick']);
        props.onClick = this.onClick;
        return React.cloneElement(input, props);
    }
}

ClickSuccess.defaultProps = {
    onClose: _.noop,
    message: null,
    renderDialog: null,
    renderer() {
        const dialogProps = {
            ref: ref => this.dialog = ref,
            message: () => _.isFunction(this.props.message) ? this.props.message(this.state.data) : this.props.message,
            onClose: () => {
                this.hide().then(this.props.onClose);
            }
        };

        if (_.isFunction(this.props.renderDialog)) {
            dialogProps['renderDialog'] = this.props.renderDialog.bind(this, {data: this.state.data, close: dialogProps.onClose});
        }

        const {Modal} = this.props;

        return (
            <webiny-click-success>
                {this.getContent()}
                <Modal.Success {...dialogProps}/>
            </webiny-click-success>
        );
    }
};

export default Webiny.createComponent(ClickSuccess, {modules: ['Modal']});
