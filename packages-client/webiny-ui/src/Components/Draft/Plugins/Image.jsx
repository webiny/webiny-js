import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Atomic from './../Toolbar/Atomic';

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.ImageEditComponent
 */
class ImageEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            size: props.data.size
        };

        this.bindMethods('resize', 'resizeStart', 'resizeEnd', 'getSize', 'btnProps');
    }

    alignImage(align) {
        this.props.updateBlockData({align});
    }

    resizeStart(e) {
        this.size = {
            width: this.resizer.clientWidth,
            height: this.resizer.clientHeight
        };

        this.aspectRatio = this.size.width / this.size.height;

        this.position = {
            x: e.clientX,
            y: e.clientY
        };
    }

    resize(e) {
        e.preventDefault();
        const deltaX = this.position.x - e.clientX;
        const deltaY = this.position.y - e.clientY;

        if (Math.abs(deltaX) > 200 || Math.abs(deltaY) > 200) {
            return;
        }

        if (deltaX !== 0) {
            this.size.width = this.size.width - deltaX;
            this.size.height = Math.round(this.size.width / this.aspectRatio);
        } else {
            this.size.height = this.size.height - deltaY;
            this.size.width = Math.round(this.size.height * this.aspectRatio);
        }

        this.position = {
            x: e.clientX,
            y: e.clientY
        };

        this.setState({size: this.size});
    }

    resizeEnd() {
        this.props.updateBlockData({size: this.state.size});
    }

    getSize(offset = 0) {
        return {
            width: _.hasIn(this.state, 'size.width') ? this.state.size.width - offset : 'auto',
            height: _.hasIn(this.state, 'size.height') ? this.state.size.height - offset : 'auto'
        };
    }

    btnProps(align) {
        return {
            icon: 'fa-align-' + align,
            type: this.props.data.align === align ? 'primary' : 'default',
            onClick: this.alignImage.bind(this, align)
        };
    }
}

ImageEditComponent.defaultProps = {
    renderer() {
        const captionChange = e => this.props.updateBlockData({caption: e.target.value});

        const draggable = {
            draggable: true,
            onDragStart: this.resizeStart,
            onDrag: this.resize,
            onDragEnd: this.resizeEnd
        };

        return (
            <Webiny.Ui.LazyLoad modules={['Grid', 'Input', 'ButtonGroup', 'Button']}>
                {(Ui) => (
                    <div className="image-plugin-wrapper">
                        <Ui.Grid.Row>
                            <Ui.Grid.Col xs={12} className="text-center">
                                <Ui.ButtonGroup>
                                    <Ui.Button {...this.btnProps('left')} label={this.i18n('Left')}/>
                                    <Ui.Button {...this.btnProps('center')} label={this.i18n('Center')}/>
                                    <Ui.Button {...this.btnProps('right')} label={this.i18n('Right')}/>
                                </Ui.ButtonGroup>
                            </Ui.Grid.Col>
                        </Ui.Grid.Row>

                        <div className="image-wrapper" style={{textAlign: this.props.data.align}}>
                            <div className="resizer" ref={resizer => this.resizer = resizer} style={this.getSize()}>
                                <img src={this.props.data.url} style={this.getSize(2)}/>
                                <span className="resize-handle br" {...draggable}/>
                            </div>
                        </div>

                        <Ui.Grid.Row>
                            <Ui.Grid.Col xs={12} className="text-center">
                                <input
                                    className="caption"
                                    value={this.props.data.caption || ''}
                                    onChange={captionChange}
                                    placeholder={Webiny.I18n('Enter a caption for this image')}/>
                            </Ui.Grid.Col>
                        </Ui.Grid.Row>
                    </div>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.ImageComponent
 */
class ImageComponent extends Webiny.Ui.Component {
    getSize(offset = 0) {
        return {
            width: _.hasIn(this.props.data, 'size.width') ? this.props.data.size.width - offset : 'auto',
            height: _.hasIn(this.props.data, 'size.height') ? this.props.data.size.height - offset : 'auto'
        };
    }
}

ImageComponent.defaultProps = {
    renderer() {
        return (
            <div className="image-plugin-wrapper">
                <div className={'image-wrapper'} style={{textAlign: this.props.data.align}}>
                    <img src={this.props.data.url} {...this.getSize.call(this)}/>
                    {this.props.data.caption ? <div>{this.props.data.caption}</div> : null}
                </div>
            </div>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.ImagePlugin
 */
class ImagePlugin extends Webiny.Draft.AtomicPlugin {
    constructor(config = {}) {
        super(config);
        this.validate = _.get(config, 'validate', 'required');
        this.name = 'image';
        this.api = null;
        this.accept = ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'];
        this.cropper = {
            inline: true,
            title: 'Crop your image',
            action: 'Upload image',
            config: {
                closeOnClick: false,
                autoCropArea: 0.7
            }
        };

        if (config.api) {
            this.api = new Webiny.Api.Endpoint(config.api);
            if (config.query) {
                this.api.setQuery(config.query);
            }
        }

        if (config.cropper) {
            _.assign(this.cropper, config.cropper);
        }

        if (config.accept) {
            this.accept = config.accept;
        }
    }

    submitModal({model, form}) {
        if (model.image) {
            form.showLoading();
            return this.api.post('/', model.image).then(apiResponse => {
                form.hideLoading();
                delete model.image;
                const file = apiResponse.getData('entity');
                model.url = file.src;
                model.id = file.id;
                model.fromFile = true;
                this.createImageBlock(model);
            });
        }

        return this.createImageBlock(model);
    }

    createBlock() {
        this.editor.setReadOnly(true);
        this.dialog.show();
    }

    createImageBlock(model) {
        model.plugin = this.name;
        const insert = {
            type: 'atomic',
            text: ' ',
            data: model
        };

        return this.dialog.hide().then(() => {
            const editorState = this.insertDataBlock(this.editor.getEditorState(), insert);
            this.editor.setEditorState(editorState);
        });
    }

    getEditConfig() {
        return {
            toolbar: <Atomic icon="fa-image" plugin={this} tooltip="Insert an image"/>,
            customView: (
                <Webiny.Ui.LazyLoad modules={['Form', 'Input', 'Modal', 'Tabs', 'Image', 'Button']}>
                    {(Ui) => (
                        <Ui.Modal.Dialog ref={ref => this.dialog = ref}>
                            {({dialog}) => (
                                <Ui.Form onSubmit={this.submitModal.bind(this)}>
                                    {({model, form}) => {
                                        const urlValidator = model.image ? null : 'required,url';
                                        let uploadTab = null;
                                        if (this.api) {
                                            uploadTab = (
                                                <Ui.Tabs.Tab label={this.i18n('Upload')} icon="fa-upload">
                                                    <Ui.Image
                                                        name="image"
                                                        accept={this.accept}
                                                        cropper={this.cropper}/>
                                                </Ui.Tabs.Tab>
                                            );
                                        }
                                        return (
                                            <Ui.Modal.Content>
                                                <Ui.Form.Loader/>
                                                <Ui.Modal.Header title={this.i18n('Insert image')} onClose={dialog.hide}/>
                                                <Ui.Modal.Body noPadding>
                                                    <Ui.Tabs>
                                                        <Ui.Tabs.Tab label={this.i18n('URL')} icon="fa-link">
                                                            <Ui.Input
                                                                name="url"
                                                                placeholder={this.i18n('Enter an image URL')}
                                                                label={this.i18n('URL')}
                                                                validate={urlValidator}/>
                                                        </Ui.Tabs.Tab>
                                                        {uploadTab}
                                                    </Ui.Tabs>
                                                </Ui.Modal.Body>
                                                <Ui.Modal.Footer>
                                                    <Ui.Button type="default" key="cancel" label={this.i18n('Cancel')} onClick={dialog.hide}/>
                                                    <Ui.Button type="primary" key="submit" label={this.i18n('Insert')} onClick={form.submit}/>
                                                </Ui.Modal.Footer>
                                            </Ui.Modal.Content>
                                        );
                                    }}
                                </Ui.Form>
                            )}
                        </Ui.Modal.Dialog>
                    )}
                </Webiny.Ui.LazyLoad>
            ),
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: ImageEditComponent,
                        editable: false
                    };
                }
            }
        };
    }

    getPreviewConfig() {
        return {
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: ImageComponent,
                        editable: false
                    };
                }
            }
        };
    }
}

ImagePlugin.ImageEditComponent = ImageEditComponent;
ImagePlugin.ImageComponent = ImageComponent;

export default ImagePlugin;