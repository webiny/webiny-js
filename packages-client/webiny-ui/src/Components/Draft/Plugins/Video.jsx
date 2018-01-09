import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.VideoEditComponent
 */
class VideoEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            size: props.data.size,
            resizing: false
        };

        this.bindMethods('resize', 'resizeStart', 'resizeEnd', 'getSize', 'renderVideo', 'btnProps');
    }

    alignVideo(align) {
        this.props.updateBlockData({align});
    }

    resizeStart(e) {
        this.setState({resizing: true});
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
        this.setState({resizing: false});
        this.props.updateBlockData({size: this.state.size});
    }

    getSize(offset = 0) {
        return {
            width: _.hasIn(this.state, 'size.width') ? this.state.size.width - offset : 'auto',
            height: _.hasIn(this.state, 'size.height') ? this.state.size.height - offset : 'auto'
        };
    }

    renderVideo() {
        const data = this.props.data;
        let props, embedUrl;

        if (data.type === 'youtube') {
            embedUrl = 'http://www.youtube.com/embed/' + data.videoId + '?wmode=transparent&autoplay=0&html5=1';
        } else {
            embedUrl = 'http://player.vimeo.com/video/' + data.videoId + '?wmode=transparent&autoplay=0&type=html5';
        }

        props = {
            src: embedUrl,
            width: this.getSize(2).width,
            height: this.getSize(2).height,
            frameBorder: 0,
            wmode: 'Opaque',
            allowFullScreen: true
        };

        return <iframe {...props}/>;
    }

    btnProps(align) {
        return {
            icon: 'fa-align-' + align,
            type: this.props.data.align === align ? 'primary' : 'default',
            onClick: this.alignVideo.bind(this, align)
        };
    }
}

VideoEditComponent.defaultProps = {
    renderer() {
        const captionChange = e => this.props.updateBlockData({caption: e.target.value});

        const draggable = {
            draggable: true,
            onDragStart: this.resizeStart,
            onDrag: this.resize,
            onDragEnd: this.resizeEnd
        };

        const resizeOverlay = {
            position: 'absolute',
            width: '100%',
            height: '100%'
        };

        return (
            <Webiny.Ui.LazyLoad modules={['Grid', 'Input', 'ButtonGroup', 'Button']}>
                {(Ui) => (
                    <div className="video-plugin-wrapper">
                        <Ui.Grid.Row>
                            <Ui.Grid.Col xs={12} className="text-center">
                                <Ui.ButtonGroup>
                                    <Ui.Button {...this.btnProps('left')} label={this.i18n('Left')}/>
                                    <Ui.Button {...this.btnProps('center')} label={this.i18n('Center')}/>
                                    <Ui.Button {...this.btnProps('right')} label={this.i18n('Right')}/>
                                </Ui.ButtonGroup>
                            </Ui.Grid.Col>
                        </Ui.Grid.Row>

                        <div className={'video-wrapper'} style={{textAlign: this.props.data.align}}>
                            <div className="resizer" ref={ref => this.resizer = ref} style={this.getSize()}>
                                {this.state.resizing ? <div style={resizeOverlay}/> : null}
                                {this.renderVideo()}
                                <span className="resize-handle br" {...draggable}/>
                            </div>
                        </div>
                        <Ui.Grid.Row>
                            <Ui.Grid.Col xs={12} className="text-center">
                                <input
                                    className="caption"
                                    value={this.props.data.caption || ''}
                                    onChange={captionChange}
                                    placeholder={this.i18n('Enter a caption for this video')}/>
                            </Ui.Grid.Col>
                        </Ui.Grid.Row>
                    </div>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.VideoComponent
 */
class VideoComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('renderVideo');
    }

    getSize(offset = 0) {
        return {
            width: _.hasIn(this.props.data, 'size.width') ? this.props.data.size.width - offset : 'auto',
            height: _.hasIn(this.props.data, 'size.height') ? this.props.data.size.height - offset : 'auto'
        };
    }

    renderVideo() {
        const data = this.props.data;
        let props, embedUrl;

        if (data.type === 'youtube') {
            embedUrl = 'http://www.youtube.com/embed/' + data.videoId + '?wmode=transparent&autoplay=0&html5=1';
        } else {
            embedUrl = 'http://player.vimeo.com/video/' + data.videoId + '?wmode=transparent&autoplay=0&type=html5';
        }

        props = {
            src: embedUrl,
            width: this.getSize().width,
            height: this.getSize().height,
            frameBorder: 0,
            wmode: 'Opaque',
            allowFullScreen: true
        };

        return <iframe {...props}/>;
    }
}

VideoComponent.defaultProps = {
    renderer() {
        return (
            <div className="video-plugin-wrapper">
                <div className={'video-wrapper'} style={{textAlign: this.props.data.align}}>
                    {this.renderVideo()}
                    <div>{this.props.data.caption}</div>
                </div>
            </div>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.VideoPlugin
 */
class VideoPlugin extends Webiny.Draft.AtomicPlugin {
    constructor(config = {}) {
        super(config);
        this.validate = _.get(config, 'validate', 'required');
        this.name = 'video';

        this.showDropdown = this.showDropdown.bind(this);
        this.submitForm = this.submitForm.bind(this);
    }

    parseYoutubeLink(link) {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        return link.match(regex) ? RegExp.$1 : false;
    }

    parseVimeoLink(link) {
        if (link.indexOf('#') > 0) {
            const tmp = link.split('#');
            link = tmp[0];
        }

        let regex = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        let id = link.match(regex) ? RegExp.$3 : false;
        if (!id) {
            // Try another regex
            regex = /vimeo\.com\/(?:video\/)?(\d+)/;
            id = link.match(regex) ? RegExp.$1 : false;
        }
        return id;
    }

    showDropdown() {
        this.editor.setReadOnly(true);
    }

    createVideoBlock(model) {
        model.plugin = this.name;
        const insert = {
            type: 'atomic',
            text: ' ',
            data: model
        };
        const editorState = this.insertDataBlock(this.editor.getEditorState(), insert);
        this.editor.setEditorState(editorState);
    }

    submitForm({model}) {
        // Parse URL and detect type
        const data = _.clone(model);

        let url = model.url;
        let videoId;
        if ((videoId = this.parseYoutubeLink(url))) {
            data.type = 'youtube';
            data.videoId = videoId;
        } else if ((videoId = this.parseVimeoLink(url))) {
            data.type = 'vimeo';
            data.videoId = videoId;
        }

        this.createVideoBlock(data);
        this.form.resetForm();
        this.dropdown.close();
    }


    getEditConfig() {
        return {
            toolbar: () => {
                return (
                    <Webiny.Ui.LazyLoad modules={['Form', 'Input', 'Dropdown', 'Grid', 'Icon', 'Button']}>
                        {(Ui) => {
                            const props = {
                                ref: ref => this.dropdown = ref,
                                title: <Ui.Icon icon="fa-video-camera"/>,
                                closeOnClick: false,
                                onShow: this.showDropdown,
                                className: 'toolbar-dropdown',
                                disabled: this.editor.getReadOnly()
                            };
                            return (
                                <Ui.Dropdown {...props}>
                                    {() => (
                                        <Ui.Form ref={ref => this.form = ref} onSubmit={this.submitForm}>
                                            {({form}) => (
                                                <div style={{width: 400}}>
                                                    <Ui.Grid.Row>
                                                        <Ui.Grid.Col xs={10}>
                                                            <Ui.Input
                                                                name="url"
                                                                placeholder={this.i18n('Enter a video URL')}
                                                                validate={this.validate}
                                                                showValidationIcon={false}/>
                                                        </Ui.Grid.Col>
                                                        <Ui.Grid.Col xs={2}>
                                                            <Ui.Button
                                                                type="primary"
                                                                align="right"
                                                                label={this.i18n('Insert')}
                                                                onClick={form.submit}/>
                                                        </Ui.Grid.Col>
                                                    </Ui.Grid.Row>
                                                </div>
                                            )}
                                        </Ui.Form>
                                    )}
                                </Ui.Dropdown>
                            );
                        }}
                    </Webiny.Ui.LazyLoad>
                );
            },
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: VideoEditComponent,
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
                        component: VideoComponent,
                        editable: false
                    };
                }
            }
        };
    }
}

VideoPlugin.VideoEditComponent = VideoEditComponent;
VideoPlugin.VideoComponent = VideoComponent;

export default VideoPlugin;