import React from "react";
import _ from "lodash";
import { app, i18n, createComponent, Uploader } from "webiny-app";
import { FormComponent } from "webiny-app-ui";

const t = i18n.namespace("Webiny.Ui.HtmlEditor");
class HtmlEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState,
            cropImage: null,
            uploadPercentage: null,
            value: props.value
        };

        this.dom = null;
        this.editor = null;
        this.delay = null;
        this.index = 0;


        // TODO: create `upload` graphql query
        // Maybe think of a separate express url that handles file uploads?
        // this.uploader = new Uploader(api);

        [
            "getTextareaElement",
            "getEditor",
            "getCropper",
            "onCropperHidden",
            "uploadImage",
            "fileChanged",
            "applyValue",
            "changed",
            "renderError"
        ].map(m => (this[m] = this[m].bind(this)));
    }

    componentDidMount() {
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }

        const { Quill } = this.props.modules;
        this.editor = new Quill(this.getTextareaElement(), {
            modules: {
                toolbar: this.props.toolbar
            },
            theme: "snow",
            bounds: document.body
        });

        const toolbar = this.editor.getModule("toolbar");
        toolbar.addHandler("image", () => {
            this.reader.getFiles();
        });

        this.editor.on("text-change", () => {
            this.setState({ value: this.editor.root.innerHTML }, this.changed);
        });

        this.editor.pasteHTML(this.props.value);
    }

    componentWillReceiveProps(props) {
        if (!this.delay && props.value !== this.editor.root.innerHTML) {
            this.editor.pasteHTML(props.value);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const oldState = _.pick(this.state, ["cropImage", "uploadPercentage", "error"]);
        const newState = _.pick(nextState, ["cropImage", "uploadPercentage", "error"]);
        return !_.isEqual(oldState, newState);
    }

    componentDidUpdate() {
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
            this.setState({ error });
            return;
        }

        this.setState({ error: null });

        if (this.props.cropper) {
            this.setState({ cropImage: file });
        } else {
            this.uploadImage(file);
        }
    }

    uploadImage(data) {
        this.uploader.upload(
            data,
            ({ percentage }) => {
                this.setState({ uploadPercentage: percentage });
            },
            ({ file }) => {
                this.editor.insertEmbed(this.index, "image", file.entity.src);
                // reposition index to previous position
                this.setState({ uploadPercentage: null });
                this.editor.setSelection({ index: this.index, length: 0 });
            },
            ({ response }) => {
                app.services.get("growler").danger(response.message, t`Upload failed`);
                this.setState({ uploadPercentage: null });
            }
        );
    }

    getCropper(children = null) {
        const { cropper, modules: { Cropper } } = this.props;

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
                    image={this.state.cropImage}
                >
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
                image={this.state.cropImage}
            >
                {children}
            </Cropper.Modal>
        );
    }

    onCropperHidden() {
        this.setState({ cropImage: null });
    }

    getEditor() {
        return this.editor;
    }

    getTextareaElement() {
        return this.dom;
    }

    renderError() {
        let error = null;
        if (this.state.error) {
            const { Alert } = this.props.modules;
            error = <Alert type="error">{this.state.error.message}</Alert>;
        }
        return error;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Alert, Progress, FileReader, FormGroup } = this.props.modules;

        let uploader = null;
        if (this.state.uploadPercentage !== null) {
            uploader = (
                <div>
                    <strong>Your image is being uploaded...</strong>
                    <Progress value={this.state.uploadPercentage} />
                </div>
            );
        }

        return (
            <FormGroup className={this.props.className}>
                {this.renderLabel.call(this)}
                {this.renderInfo.call(this)}
                <div className="inputGroup">
                    {this.renderError()}
                    {uploader}
                    <div ref={ref => (this.dom = ref)} className="editor" />
                    <FileReader
                        accept={this.props.accept}
                        onReady={reader => (this.reader = reader)}
                        sizeLimit={this.props.sizeLimit}
                        onChange={this.fileChanged}
                    />
                    {this.getCropper(
                        <Alert type="info" title={t`Hint`}>{t`Scroll to zoom in/out`}</Alert>
                    )}
                </div>
                {this.props.renderDescription.call(this)}
            </FormGroup>
        );
    }
}

HtmlEditor.defaultProps = {
    imageApi: "/entities/webiny/images",
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    sizeLimit: 2485760,
    toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block", "link", "image"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"]
    ],
    cropper: {
        title: "Crop your image",
        action: "Insert image",
        config: {
            closeOnClick: false,
            autoCropArea: 0.7
        }
    }
};

export default createComponent([HtmlEditor, FormComponent], {
    modules: [
        "Alert",
        "Cropper",
        "FileReader",
        "Progress",
        "FormGroup",
        { Quill: "Vendors/Quill" }
    ],
    formComponent: true
});
