import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import BaseCropper from './BaseCropper';

/**
 * @i18n.namespace Webiny.Ui.Cropper.ModalCropper
 */
class ModalCropper extends BaseCropper {

    constructor(props) {
        super(props);
        this.bindMethods('show,hide');
    }

    componentDidUpdate(prevProps) {
        super.componentDidUpdate();
        if (!prevProps.image && this.props.image) {
            return this.show();
        }

        if (prevProps.image && !this.props.image) {
            return this.hide();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps.image, this.props.image) || !_.isEqual(nextState, this.state);
    }

    applyCropping() {
        const model = this.getImage();
        this.hide().then(() => {
            this.props.onCrop(model);
        });
    }

    hide() {
        return this.dialog && this.dialog.hide();
    }

    show() {
        return this.dialog && this.dialog.show();
    }
}

ModalCropper.defaultProps = _.merge({}, BaseCropper.defaultProps, {
    config: {},
    title: Webiny.I18n('Crop image'),
    closeOnClick: false,
    onCrop: _.noop,
    onShown: _.noop,
    onHidden: _.noop,
    renderer() {
        const props = this.props;

        const modalProps = {
            onShown: props.onShown,
            onHide: this.destroyCropper,
            onHidden: props.onHidden,
            closeOnClick: props.config.closeOnClick || props.closeOnClick,
            className: ''
        };

        const {Modal, Button} = props;

        return (
            <Modal.Dialog {...modalProps} ref={dialog => this.dialog = dialog}>
                <Modal.Content>
                    <Modal.Header title={props.title}/>
                    <Modal.Body>
                        {props.children}
                        <div className="modalCrop">
                            <img
                                id={this.id}
                                onLoad={this.initCropper}
                                width="100%"
                                src={props.image && props.image.src + this.getCacheBust()}
                                style={{maxWidth: '100%'}}/>
                            <div className="clearfix"/>
                            {this.i18n('Cropped image size: {size}', {size: <strong>{this.state.width}x{this.state.height}</strong>})}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="primary" className="pull-right ml5" onClick={this.applyCropping}>{props.action}</Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
});

export default Webiny.createComponent(ModalCropper, {
    modules: ['Modal', 'Button', {Cropper: 'Webiny/Vendors/Cropper'}],
    api: ['show', 'hide']
});