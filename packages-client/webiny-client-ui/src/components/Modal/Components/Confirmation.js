import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';
import { ModalComponent } from 'webiny-client-ui';
import Dialog from './Dialog';
import Content from './Content';
import Body from './Body';
import Footer from './Footer';

/**
 * @i18n.namespace Webiny.Ui.Modal.Confirmation
 */
class Confirmation extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: false
        };

        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
    }

    showLoading() {
        this.setState({ loading: true });
    }

    hideLoading() {
        this.setState({ loading: false });
    }

    onCancel() {
        if (!this.props.animating) {
            if (_.isFunction(this.props.onCancel)) {
                return this.props.onCancel(this);
            }
            return this.props.hide();
        }
    }

    /**
     * This function is executed when dialog is confirmed, it handles all the maintenance stuff and executes `onConfirm` callback
     * passed through props and also passes optional `data` object to that callback.
     *
     * It can receive a `data` object containing arbitrary data from your custom form, for example.
     *
     * If no `data` is passed - Confirmation dialog will check if `data` prop is defined and use that as data payload for `onConfirm`
     * callbacks.
     *
     * @param data
     * @returns {Promise.<TResult>}
     */
    onConfirm(data = null) {
        if (!this.props.animating && _.isFunction(this.props.onConfirm)) {
            this.showLoading();
            data = _.isPlainObject(data) ? data : this.props.data;
            return Promise.resolve(this.props.onConfirm({ data, dialog: this })).then(result => {
                this.hideLoading();
                if (this.props.autoHide) {
                    return this.props.hide().then(() => {
                        // If the result of confirmation is a function, it means we need to hide the dialog before executing it.
                        // This is often necessary if the function will set a new state in the view - it will re-render itself and the modal
                        // animation will be aborted (most common case is delete confirmation).
                        if (_.isFunction(result)) {
                            // The result of the function will be passed to `onComplete` and not the function itself
                            result = result();
                        }
                        this.props.onComplete({ data: result });
                    });
                }
            });
        }
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let content = this.props.message || this.props.children;
        if (_.isFunction(content)) {
            content = content({ data: this.props.data });
        }

        const { Loader, Button, styles } = this.props;

        return (
            <Dialog
                modalContainerTag="confirmation-modal"
                className={styles.alertModal}
                onCancel={this.props.onCancel}
                closeOnClick={this.props.closeOnClick}>
                {this.state.loading && <Loader/>}
                <Content>
                    <Body>
                    <div className="text-center">
                        <h4>{this.props.title}</h4>

                        <p>{content}</p>
                    </div>
                    </Body>
                    <Footer>
                        <Button type="default" label={this.props.cancel} onClick={this.onCancel}/>
                        <Button type="primary" label={this.props.confirm} onClick={this.onConfirm}/>
                    </Footer>
                </Content>
            </Dialog>
        );
    }
}

Confirmation.defaultProps = {
    title: i18n('Confirmation dialog'),
    confirm: i18n('Yes'),
    cancel: i18n('No'),
    onConfirm: _.noop,
    onComplete: _.noop,
    onCancel: null,
    autoHide: true,
    closeOnClick: false,
    data: null
};

export default createComponent([Confirmation, ModalComponent], { modules: ['Button', 'Loader'] });