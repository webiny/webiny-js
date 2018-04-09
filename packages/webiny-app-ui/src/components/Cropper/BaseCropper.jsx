import React from "react";
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-app';

const t = i18n.namespace("Webiny.Ui.Cropper.BaseCropper");
class BaseCropper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            width: 0,
            height: 0
        };

        this.id = _.uniqueId('img-cropper-');

        [
            'initCropper',
            'destroyCropper',
            'getImageModel',
            'getCacheBust',
            'applyCropping'
        ].map(m => this[m] = this[m].bind(this));

        this.options = {
            // Define the view mode of the cropper
            viewMode: 1, // 0, 1, 2, 3

            // Define the dragging mode of the cropper
            dragMode: 'crop', // 'crop', 'move' or 'none'

            // Define the aspect ratio of the crop box
            aspectRatio: NaN,

            // An object with the previous cropping result data
            data: null,

            // A selector for adding extra containers to preview
            preview: '',

            // Re-render the cropper when resize the window
            responsive: true,

            // Restore the cropped area after resize the window
            restore: true,

            // Check if the current image is a cross-origin image
            checkCrossOrigin: true,

            // Check the current image's Exif Orientation information
            checkOrientation: true,

            // Show the black modal
            modal: true,

            // Show the dashed lines for guiding
            guides: false,

            // Show the center indicator for guiding
            center: true,

            // Show the white modal to highlight the crop box
            highlight: true,

            // Show the grid background
            background: true,

            // Enable to crop the image automatically when initialize
            autoCrop: true,

            // Define the percentage of automatic cropping area when initializes
            autoCropArea: 0.8,

            // Enable to move the image
            movable: true,

            // Enable to rotate the image
            rotatable: true,

            // Enable to scale the image
            scalable: true,

            // Enable to zoom the image
            zoomable: true,

            // Enable to zoom the image by dragging touch
            zoomOnTouch: true,

            // Enable to zoom the image by wheeling mouse
            zoomOnWheel: true,

            // Define zoom ratio when zoom the image by wheeling mouse
            wheelZoomRatio: 0.1,

            // Enable to move the crop box
            cropBoxMovable: true,

            // Enable to resize the crop box
            cropBoxResizable: true,

            // Toggle drag mode between "crop" and "move" when click twice on the cropper
            toggleDragModeOnDblclick: true,

            // Size limitation
            minCanvasWidth: 0,
            minCanvasHeight: 0,
            minCropBoxWidth: 0,
            minCropBoxHeight: 0,
            minContainerWidth: 200,
            minContainerHeight: 100,

            // Shortcuts of events
            ready: null,
            cropstart: null,
            cropmove: null,
            cropend: null,
            crop: null,
            zoom: null
        };
    }

    componentWillUnmount() {
        this.destroyCropper();
    }

    initCropper(element) {
        const { Cropper } = this.props.modules;
        const data = _.merge({}, this.options, this.props.config);
        data.crop = e => {
            this.setState({ width: Math.floor(e.detail.width), height: Math.floor(e.detail.height) });
        };
        data.ready = () => {
            if (data.width && data.height) {
                this.cropper.setCropBoxData({
                    width: data.width,
                    height: data.height
                });
            }
        };

        this.cropper = new Cropper(element, data);
    }

    destroyCropper() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    getCacheBust() {
        let cacheBust = '';
        if (this.props.image && this.props.image.modifiedOn && !this.props.image.data) {
            cacheBust = '?ts=' + new Date(this.props.image.modifiedOn).getTime();
        }
        return cacheBust;
    }

    applyCropping() {
        this.props.onCrop(this.getImageModel());
    }

    getImageModel() {
        const model = _.clone(this.props.image);
        let options = {};
        let canvas = null;

        if (this.props.config.getCroppedCanvas) {
            canvas = this.props.config.getCroppedCanvas({ cropper: this.cropper, props: this.props });
        } else {
            if (this.props.config.width) {
                options.width = this.props.config.width;
            }

            if (this.props.config.height) {
                options.height = this.props.config.height;
            }

            canvas = this.cropper.getCroppedCanvas(options);
        }

        model.data = canvas.toDataURL(model.type);
        return model;
    }

    render() {
        return React.cloneElement(this.props.children, {
            ..._.omit(this.props, ['children', 'modules']),
            width: this.state.width,
            height: this.state.height,
            initCropper: this.initCropper.bind(this),
            getCacheBust: this.getCacheBust.bind(this),
            applyCropping: this.applyCropping.bind(this),
            destroyCropper: this.destroyCropper.bind(this),
            getImageModel: this.getImageModel.bind(this)
        });
    }
}

BaseCropper.defaultProps = {
    config: {},
    onCrop: _.noop,
    action: t`Apply cropping`
};

export default createComponent(BaseCropper, { modules: [{ Cropper: 'Vendor.Cropper' }] });