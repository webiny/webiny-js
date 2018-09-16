import React from "react";
import _ from "lodash";
import { inject, i18n } from "webiny-app";
import { withFormComponent } from "webiny-ui";
import styles from "./styles.module.css";

const t = i18n.namespace("Webiny.Ui.File");

@withFormComponent()
@inject({
    modules: ["FileReader", "FormGroup", "Alert"],
    styles
})
class SimpleFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.initialState
        };
        ["fileChanged", "filesChanged", "getFiles", "clearFiles"].map(
            m => (this[m] = this[m].bind(this))
        );
    }

    clearFiles() {
        this.props.onChange(null).then(() => {
            this.setState({ isValid: null });
        });
    }

    fileChanged(file, error) {
        if (error) {
            this.setState({ error });
            return;
        }

        if (_.has(file, "data")) {
            this.props.onChange(file).then(this.props.validate);
        }
    }

    filesChanged(files, errors) {
        if (errors.length > 0) {
            this.setState({ errors });
        }

        if (files.length > 0) {
            this.props.onChange(files).then(this.props.validate);
        }
    }

    getFiles(e) {
        this.setState({ error: null, errors: null });
        e.stopPropagation();
        if (this.props.onGetFiles) {
            this.props.onGetFiles({ $this: this });
            return;
        }
        this.reader.getFiles();
    }

    renderValue() {
        if (this.props.multiple) {
            return this.props.value
                ? t`{files|count:1:file:default:files} selected`({
                      files: _.get(this.props.value, "length", 0)
                  })
                : "";
        }

        return _.get(this.props.value, "name", "");
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { FileReader, FormGroup },
            styles
        } = this.props;

        const fileReaderProps = {
            accept: this.props.accept,
            onReady: reader => (this.reader = reader),
            onChange: this.props.multiple ? this.filesChanged : this.fileChanged,
            multiple: this.props.multiple,
            readAs: this.props.readAs,
            sizeLimit: this.props.sizeLimit
        };
        const fileReader = <FileReader {...fileReaderProps} />;

        let clearBtn = null;
        if (this.props.value) {
            clearBtn = (
                <div
                    className={[styles.fileBtn, styles.clearBtn, styles.clearBtnIcon].join(" ")}
                    onClick={this.clearFiles}
                >
                    <span>Clear</span>
                </div>
            );
        }

        let error = null;
        if (this.state.error || this.state.errors) {
            error = this.props.multiple
                ? this.props.renderErrors.call(this)
                : this.props.renderError.call(this);
        }

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <div>{error}</div>
                <div className={styles.wrapper + " inputGroup"}>
                    <input
                        type="text"
                        placeholder={this.props.placeholder}
                        readOnly={true}
                        onClick={this.getFiles}
                        className={styles.input}
                        value={this.renderValue()}
                        onChange={_.noop}
                    />

                    {clearBtn}
                    <div
                        className={styles.fileBtn + " " + styles.uploadBtn}
                        onClick={this.getFiles}
                    >
                        <span>Select</span>
                        {fileReader}
                    </div>
                    {this.props.renderDescription.call(this)}
                    {this.props.renderValidationMessage.call(this)}
                </div>
            </FormGroup>
        );
    }
}

SimpleFile.defaultProps = {
    accept: [],
    multiple: false,
    sizeLimit: 2485760,
    readAs: "data", // or binary
    onGetFiles: null,
    renderError() {
        const {
            modules: { Alert }
        } = this.props;
        return (
            <Alert title={t`A file could not be selected`} type="error" close>
                <ul>
                    <li>
                        <strong>{this.state.error.name}</strong>: {this.state.error.message}
                    </li>
                </ul>
            </Alert>
        );
    },
    renderErrors() {
        const {
            modules: { Alert }
        } = this.props;
        const data = [];
        _.each(this.state.errors, (err, key) => {
            data.push(
                <li key={key}>
                    <strong>{err.name}</strong>: {err.message}
                </li>
            );
        });

        return (
            <Alert title={t`Some files could not be selected`} type="error" close>
                {data && <ul>{data}</ul>}
            </Alert>
        );
    }
};

export default SimpleFile;
