import React from 'react';
import _ from 'lodash';
import { app, createComponent, i18n } from 'webiny-client';
import BaseCropper from './BaseCropper';
import CropperDialog from "./CropperDialog";

const t = i18n.namespace("Webiny.Ui.Cropper.ModalCropper");
class ModalCropper extends React.Component {
    constructor() {
        super();
        this.dialogId = _.uniqueId('modal-cropper-');
        this.hide = this.hide.bind(this);
        this.show = this.show.bind(this);
        this.applyCropping = this.applyCropping.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.image && this.props.image) {
            return this.show();
        }

        if (prevProps.image && !this.props.image) {
            return this.hide();
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps.image, this.props.image)
            || !_.isEqual(nextProps.width, this.props.width)
            || !_.isEqual(nextProps.height, this.props.height)
            || !_.isEqual(nextState, this.state);
    }

    applyCropping() {
        const model = this.props.getImageModel();
        this.hide().then(() => {
            this.props.onCrop(model);
        });
    }

    hide() {
        return app.services.get('modal').hide(this.dialogId);
    }

    show() {
        return app.services.get('modal').show(this.dialogId);
    }

    render() {
        const { modules: { Modal, Button }, ...props } = this.props;

        const modalProps = {
            name: this.dialogId,
            onShown: props.onShown,
            onHide: props.destroyCropper,
            onHidden: props.onHidden,
            closeOnClick: props.config.closeOnClick || props.closeOnClick,
            className: '',
        };

        return (
            <CropperDialog {...modalProps}>
                <Modal.Content>
                    <Modal.Header title={props.title} onClose={this.hide}/>
                    <Modal.Body>
                        {props.children}
                        <div className="modalCrop">
                            <img
                                onLoad={e => props.initCropper(e.currentTarget)}
                                width="100%"
                                src={props.image && (props.image.data || props.image.src) + props.getCacheBust()}
                                style={{ maxWidth: '100%' }}/>
                            <div className="clearfix"/>
                            {/*  TODO: @i18nRefactor */}
                            {t`Cropped image size: {size}`({size: props.width + 'x' + props.height})}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="primary" className="pull-right ml5" onClick={this.applyCropping}>
                            {props.action}
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </CropperDialog>
        );
    }
}


ModalCropper.defaultProps = {
    config: {},
    title: t`Crop image`,
    closeOnClick: false,
    onCrop: _.noop,
    onShown: _.noop,
    onHidden: _.noop
};

export default createComponent([ModalCropper, BaseCropper], {
    modules: ['Modal', 'Button']
});