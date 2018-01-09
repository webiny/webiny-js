import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import {Webiny} from 'webiny-client';
import Image from './Image';
import styles from './styles.css';

const placeholder = document.createElement('div');
placeholder.className = styles.placeholder;
placeholder.textContent = 'Drop here';

/**
 * @i18n.namespace Webiny.Ui.Gallery
 */
class Gallery extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.lastId = null;
        this.dragged = null;

        this.bindMethods(
            'getFiles',
            'getImageIndex',
            'getCropper',
            'saveImage',
            'deleteImage',
            'applyCropping',
            'onCropperHidden',
            'filesChanged',
            'onDrop',
            'onDragOver',
            'onDragLeave',
            'onImageDragOver',
            'onImageDragStart',
            'onImageDragEnd'
        );

        _.assign(this.state, {
            cropImage: null,
            actualWidth: 0,
            actualHeight: 0,
            images: [],
            dragOver: false,
            errors: null
        });
    }

    componentDidMount() {
        super.componentDidMount();
        this.setupComponent(this.props);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setupComponent(props);
    }

    setupComponent(props) {
        this.dom = ReactDOM.findDOMNode(this);
        if (props.value) {
            const images = props.value.map(img => {
                img.key = _.uniqueId('image-');
                return img;
            });
            this.setState({images});
        }
    }

    getImageIndex(image) {
        let index = null;
        this.state.images.map((stateImage, stateIndex) => {
            if (stateImage.key === image.key) {
                index = stateIndex;
            }
        });
        return index;
    }

    saveImage(image) {
        const numberOfImages = _.get(this.props, 'value.length', 0) + 1;
        // Show error message if maximum images limit is reached and the image being saved does not yet exists in the gallery
        if (this.props.maxImages && numberOfImages > this.props.maxImages && !_.find(this.props.value, {name: image.name})) {
            const errors = this.state.errors || [];
            errors.push({name: image.name, message: this.props.maxImagesMessage});
            this.setState({errors});
            return;
        }

        const index = this.getImageIndex(image);
        const state = this.state;
        if (index !== null) {
            _.set(state, 'images.' + index, image);
        } else {
            image.order = state.images.length;
            state.images.push(image);
        }
        this.props.onChange(state.images);
        this.props.onSaveImage({image});
    }

    applyCropping(newImage) {
        this.setState({cropImage: null}, () => {
            this.saveImage(newImage);
        });
    }

    onCropperHidden() {
        this.setState({cropImage: null});
    }

    filesChanged(files, errors) {
        if (errors && errors.length) {
            this.setState({errors});
        } else {
            this.setState({errors: null});
        }

        if (files.length === 1) {
            const file = files[0];
            file.key = _.uniqueId('image-');
            if (this.props.newCropper) {
                return this.setState({cropImage: file});
            }

            return this.setState({cropImage: null}, () => {
                this.saveImage(file);
            });
        }

        files.map(img => {
            img.key = _.uniqueId('image-');
            this.saveImage(img);
        });
    }

    getFiles(e) {
        e.stopPropagation();
        this.refs.reader.getFiles();
    }

    onDragOver(e) {
        if (this.dragged) {
            return;
        }

        e.preventDefault();
        this.setState({
            dragOver: true
        });
    }

    onDragLeave() {
        if (this.dragged) {
            return;
        }

        this.setState({
            dragOver: false
        });
    }

    onDrop(e) {
        if (this.dragged) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        e.persist();

        this.setState({
            dragOver: false
        });

        this.refs.reader.readFiles(e.dataTransfer.files);
    }

    editImage(image, index) {
        this.setState({cropImage: image, cropIndex: index});
    }

    deleteImage(image, index) {
        const state = this.state;
        state.images.splice(index, 1);
        state.images = state.images.map((item, i) => {
            item.order = i;
            return item;
        });
        this.props.onChange(state.images);
    }

    onImageDragStart(e) {
        this.dragged = $(e.currentTarget).closest('[data-role="image"]')[0];
        if (this.dragged) {
            e.dataTransfer.setDragImage(this.dragged, 10, 50);
            // Firefox requires calling dataTransfer.setData for the drag to properly work
            e.dataTransfer.setData('text/html', this.dragged);
        }
    }

    onImageDragEnd(e) {
        e.preventDefault();
        if (!this.dragged) {
            return;
        }
        // Update state
        let data = this.state.images;
        const from = Number(this.dragged.dataset.id);
        let to = Number(this.over.dataset.id);
        if (from < to) {
            to--;
        }
        if (this.nodePlacement === 'after') {
            to++;
        }

        this.dragged.style.display = 'inline-block';
        if (this.dragged.parentNode === placeholder.parentNode) {
            this.dragged.parentNode.removeChild(placeholder);
        }
        this.dragged = null;

        data.splice(to, 0, data.splice(from, 1)[0]);
        data = data.map((item, index) => {
            item.order = index;
            return item;
        });
        this.props.onChange(data);
    }

    onImageDragOver(e) {
        if (!this.dragged) {
            return;
        }
        e.preventDefault();
        this.dragged.style.display = 'none';
        const over = $(e.target).closest('[data-role="image"]')[0];
        if (!over || $(over).hasClass('placeholder')) {
            return;
        }
        this.over = over;

        // Inside the dragOver method
        const relX = e.clientX - $(over).offset().left;
        const width = over.offsetWidth / 2;
        const parent = over.parentNode;

        if (relX > width) {
            this.nodePlacement = 'after';
            parent.insertBefore(placeholder, over.nextElementSibling);
        } else if (relX < width) {
            this.nodePlacement = 'before';
            parent.insertBefore(placeholder, over);
        }
    }

    getCropper(children = null) {
        let cropper = this.props.newCropper;
        if (this.state.cropImage && this.state.cropImage.id) {
            cropper = this.props.editCropper;
        }

        if (!cropper) {
            return null;
        }

        const {Cropper} = this.props;

        if (cropper.inline) {
            return (
                <Cropper.Inline
                    title={cropper.title}
                    action={cropper.action}
                    onHidden={this.onCropperHidden}
                    onCrop={this.applyCropping}
                    config={cropper.config}
                    image={this.state.cropImage}>
                    {children}
                </Cropper.Inline>
            );
        }

        return (
            <Cropper.Modal
                title={cropper.title}
                action={cropper.action}
                onHidden={this.onCropperHidden}
                onCrop={this.applyCropping}
                config={cropper.config}
                image={this.state.cropImage}>
                {children}
            </Cropper.Modal>
        );
    }
}

Gallery.defaultProps = {
    accept: ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'],
    sizeLimit: 10000000,
    maxImages: null,
    maxImagesMessage: Webiny.I18n('Maximum number of images reached!'),
    newCropper: {},
    editCropper: {},
    onSaveImage: _.noop,
    renderer() {
        const {FileReader, Alert, Input, FormGroup, styles} = this.props;

        let message = null;
        if (this.state.images.length === 0) {
            message = (
                <div>
                    <span className={styles.mainText}>{this.i18n('DRAG FILES HERE')}</span>
                </div>
            );
        }

        const props = {
            onDrop: this.onDrop,
            onDragLeave: this.onDragLeave,
            onDragOver: this.onDragOver,
            onClick: this.getFiles
        };

        let css = this.classSet(
            styles.trayBin,
            styles.trayBinEmpty
        );

        if (this.state.images.length > 0) {
            css = this.classSet(styles.trayBin);
        }

        let errors = null;
        if (this.state.errors) {
            const data = [];
            _.each(this.state.errors, (err, key) => {
                data.push(<li key={key}><strong>{err.name}</strong>: {err.message}</li>);
            });

            errors = (
                <Alert title={this.i18n('Some files could not be added to the gallery')} type="error">
                    {data && <ul>{data}</ul>}
                </Alert>
            );
        }

        return (
            <FormGroup>
                <div className={css}>
                    {errors}
                    <div className={styles.container} {...props}>
                        {message}
                        {this.state.images.map((item, index) => {
                            const imageProps = {
                                key: item.id || index,
                                index,
                                image: item,
                                onEdit: () => this.editImage(item, index),
                                onDelete: () => {
                                    this.deleteImage(item, index);
                                },
                                onDragStart: this.onImageDragStart,
                                onDragEnd: this.onImageDragEnd,
                                onDragOver: this.onImageDragOver
                            };

                            return <Image {...imageProps}/>;
                        })}
                        <FileReader
                            accept={this.props.accept}
                            multiple={true}
                            ref="reader"
                            sizeLimit={this.props.sizeLimit}
                            onChange={this.filesChanged}/>
                        {this.getCropper(
                            <Input label={this.i18n('Title')} placeholder={this.i18n('Type in an image title')} {...this.bindTo('cropImage.title')}/>
                        )}
                    </div>
                    <div className={styles.uploadAction}>
                        <span>{this.i18n('Dragging not convenient?')}</span>&nbsp;
                        <a href="#" onClick={this.getFiles}>{this.i18n('SELECT FILES HERE')}</a>
                    </div>
                </div>
            </FormGroup>
        );
    }
};

Gallery.Image = Image;

export default Webiny.createComponent(Gallery, {modules: ['Alert', 'Cropper', 'FileReader', 'Input', 'FormGroup'], styles});