import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

const t = i18n.namespace("Webiny.Ui.Avatar");
class Avatar extends React.Component {
    constructor(props) {
        super(props);

        this.lastId = null;

        [
            "applyCropping",
            "onCropperHidden",
            "fileChanged",
            "editFile",
            "removeFile",
            "getFiles",
            "getCropper",
            "onDrop",
            "onDragOver",
            "onDragLeave"
        ].map(m => {
            this[m] = this[m].bind(this);
        });

        this.state = {
            ...props.initialState,
            error: null,
            cropImage: null,
            actualWidth: 0,
            actualHeight: 0
        };
    }

    componentDidMount() {
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }
    }

    applyCropping(newImage) {
        this.props.onChange(newImage).then(() => this.setState({ cropImage: null }));
    }

    onCropperHidden() {
        this.setState({ cropImage: null });
    }

    fileChanged(file, error) {
        if (error) {
            this.setState({ error });
            return;
        }

        if (_.has(file, "data")) {
            file.id = _.get(this.props, "value.id", this.lastId);
            if (this.props.cropper) {
                this.setState({ cropImage: file });
            } else {
                this.props.onChange(file);
            }
        }
    }

    editFile() {
        this.setState({
            cropImage: this.props.value
        });
    }

    removeFile(e) {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        this.lastId = (this.props.value && this.props.value.id) || null;
        this.props.onChange(null);
    }

    getFiles(e) {
        this.setState({ error: null });
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        this.reader.getFiles();
    }

    getCropper() {
        const { cropper, Cropper } = this.props;

        if (!cropper) {
            return null;
        }

        if (cropper.inline) {
            return (
                <Cropper.Inline
                    title={cropper.title}
                    action={cropper.action}
                    onHidden={this.onCropperHidden}
                    onCrop={this.applyCropping}
                    config={cropper.config}
                    image={this.state.cropImage}
                />
            );
        }

        return (
            <Cropper.Modal
                title={cropper.title}
                action={cropper.action}
                onHidden={this.onCropperHidden}
                onCrop={this.applyCropping}
                config={cropper.config}
                image={this.state.cropImage}
            />
        );
    }

    onDragOver(e) {
        e.preventDefault();
        this.setState({
            dragOver: true
        });
    }

    onDragLeave() {
        this.setState({
            dragOver: false
        });
    }

    onDrop(evt) {
        evt.preventDefault();
        evt.persist();

        this.setState({
            dragOver: false
        });

        this.reader.readFiles(evt.dataTransfer.files);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        // If inline cropper is used - render only the cropper component
        if (this.state.cropImage && _.get(this.props, "cropper.inline", false)) {
            return this.getCropper();
        }

        const model = this.props.value;
        const { Alert, Button, FileReader, styles } = this.props;

        let imageSrc = this.props.defaultImage;
        if (model) {
            imageSrc = model.data || model.src;
        }

        const imageAction = (
            <Button
                type="primary"
                icon="fa-upload"
                onClick={this.getFiles}
                className={styles.uploadBtn}
            >
                {t`Upload`}
            </Button>
        );

        const props = {
            onDrop: this.onDrop,
            onDragLeave: this.onDragLeave,
            onDragOver: this.onDragOver,
            onClick: this.getFiles,
            className: styles.avatar
        };

        return (
            <div>
                <div {...props}>
                    {this.state.error && (
                        <Alert type="error" icon={null}>
                            {this.state.error.message}
                        </Alert>
                    )}
                    <span className={styles.placeholder}>
                        {imageSrc ? (
                            <img src={imageSrc} className={styles.image} height="157" width="157" />
                        ) : (
                            this.props.empty
                        )}
                    </span>
                    {imageAction}
                    <span className={styles.smallText}>{t`JPG, PNG, GIF`}</span>
                    <FileReader
                        onReady={reader => (this.reader = reader)}
                        sizeLimit={this.props.sizeLimit}
                        accept={this.props.accept}
                        onChange={this.fileChanged}
                    />
                    {this.getCropper()}
                </div>
            </div>
        );
    }
}

Avatar.defaultProps = {
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    cropper: false,
    defaultImage: null,
    empty: "x",
    sizeLimit: 2485760
};

export default createComponent([Avatar, FormComponent], {
    modules: ["Alert", "FileReader", "Cropper", "Button"],
    formComponent: true,
    styles
});
