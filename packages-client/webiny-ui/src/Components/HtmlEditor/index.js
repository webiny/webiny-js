import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.HtmlEditor
 */
class HtmlEditor extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);


        this.editor = null;
        this.delay = null;
        this.index = 0;
        this.api = new Webiny.Api.Endpoint(props.imageApi);
        this.uploader = new Webiny.Api.Uploader(this.api);

        _.merge(this.state, {
            cropImage: null,
            uploadPercentage: null,
            value: props.value
        });

        this.bindMethods('getTextareaElement,getEditor,getCropper,onCropperHidden,uploadImage,fileChanged,applyValue,changed,renderError');
    }

    componentDidMount() {
        const {Quill} = this.props;
        this.editor = new Quill(this.getTextareaElement(), {
            modules: {
                toolbar: this.props.toolbar
            },
            theme: 'snow',
            bounds: document.body
        });

        const toolbar = this.editor.getModule('toolbar');
        toolbar.addHandler('image', () => {
            this.refs.reader.getFiles();
        });

        this.editor.on('text-change', () => {
            this.setState({value: this.editor.root.innerHTML}, this.changed);
        });

        this.editor.pasteHTML(this.props.value);
        super.componentDidMount();
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (!this.delay && props.value !== this.editor.root.innerHTML) {
            this.editor.pasteHTML(props.value);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const oldState = _.pick(this.state, ['cropImage', 'uploadPercentage', 'error']);
        const newState = _.pick(nextState, ['cropImage', 'uploadPercentage', 'error']);
        return !_.isEqual(oldState, newState);
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.editor.pasteHTML(this.state.value);
    }

    componentWillUnmount() {
        delete this.editor;
    }

    applyValue(value) {
        clearTimeout(this.delay);
        this.delay = null;
        this.props.onChange(value);
    }

    changed() {
        clearTimeout(this.delay);
        this.delay = null;
        this.delay = setTimeout(() => this.applyValue(this.state.value), 300);
    }

    fileChanged(file, error) {
        // mark current index
        this.index = this.editor.getSelection(true).index;

        if (error) {
            this.setState({error});
            return;
        }

        this.setState({error: null});

        if (this.props.cropper) {
            this.setState({cropImage: file});
        } else {
            this.uploadImage(file);
        }
    }

    uploadImage(data) {
        this.uploader.upload(data, ({percentage}) => {
            this.setState({uploadPercentage: percentage});
        }, ({file}) => {
            this.editor.insertEmbed(this.index, 'image', file.entity.src);
            // reposition index to previous position
            this.setState({uploadPercentage: null});
            this.editor.setSelection({index: this.index, length: 0});
        }, ({apiResponse}) => {
            Webiny.Growl.danger(apiResponse.getError(), this.i18n('Upload failed'));
            this.setState({uploadPercentage: null});
        });
    }

    getCropper(children = null) {
        const {cropper, Cropper} = this.props;

        if (!cropper) {
            return null;
        }

        if (cropper.inline) {
            return (
                <Cropper.Inline
                    title={cropper.title}
                    action={cropper.action}
                    onHidden={this.onCropperHidden}
                    onCrop={this.uploadImage}
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
                onCrop={this.uploadImage}
                config={cropper.config}
                image={this.state.cropImage}>
                {children}
            </Cropper.Modal>
        );
    }

    onCropperHidden() {
        this.setState({cropImage: null});
    }

    getEditor() {
        return this.editor;
    }

    getTextareaElement() {
        return ReactDOM.findDOMNode(this).querySelector('.editor');
    }

    renderError() {
        let error = null;
        if (this.state.error) {
            const {Alert} = this.props;
            error = (
                <Alert type="error">{this.state.error.message}</Alert>
            );
        }
        return error;
    }
}

HtmlEditor.defaultProps = Webiny.Ui.FormComponent.extendProps({
    imageApi: '/entities/webiny/images',
    accept: ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'],
    sizeLimit: 2485760,
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block', 'link', 'image'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'indent': '-1'}, {'indent': '+1'}],
        [{'size': ['small', false, 'large', 'huge']}],
        [{'header': [1, 2, 3, 4, 5, 6, false]}],
        [{'color': []}, {'background': []}],
        [{'font': []}],
        [{'align': []}],
        ['clean']
    ],
    cropper: {
        title: 'Crop your image',
        action: 'Insert image',
        config: {
            closeOnClick: false,
            autoCropArea: 0.7
        }
    },
    renderer() {
        const {Alert, Progress, FileReader, FormGroup} = this.props;

        let uploader = null;
        if (this.state.uploadPercentage !== null) {
            uploader = (
                <div>
                    <strong>Your image is being uploaded...</strong>
                    <Progress value={this.state.uploadPercentage}/>
                </div>
            );
        }

        return (
            <FormGroup className={this.props.className}>
                {this.renderLabel()}
                {this.renderInfo()}
                <div className="inputGroup">
                    {this.renderError()}
                    {uploader}
                    <div className="editor"/>
                    <FileReader
                        accept={this.props.accept}
                        ref="reader"
                        sizeLimit={this.props.sizeLimit}
                        onChange={this.fileChanged}/>
                    {this.getCropper(<Alert type="info" title={this.i18n('Hint')}>{this.i18n('Scroll to zoom in/out')}</Alert>)}
                </div>
                {this.renderDescription()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(HtmlEditor, {
    api: ['getEditor'],
    modules: ['Alert', 'Cropper', 'FileReader', 'Progress', 'FormGroup', {Quill: 'Webiny/Vendors/Quill'}]
});
