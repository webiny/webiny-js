import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-app";

const t = i18n.namespace("Webiny.Ui.FileReader");
class FileReader extends React.Component {
    constructor(props) {
        super(props);
        this.reset = () => {
            this.dom.value = null;
        };

        this.dom = null;

        ["onChange", "getFiles", "readFiles"].map(m => (this[m] = this[m].bind(this)));
    }

    componentDidMount() {
        this.props.onReady({
            getFiles: this.getFiles,
            readFiles: this.readFiles
        });
    }

    componentWillUnmount() {
        this.reset = _.noop;
    }

    getFiles() {
        this.dom.click();
    }

    onChange(e) {
        this.readFiles(e.target.files);
    }

    readFiles(files) {
        const output = [];
        const errors = [];
        let loadedFiles = 0;

        _.each(files, file => {
            const reader = new window.FileReader();

            reader.onloadend = (f => {
                return e => {
                    loadedFiles++;
                    const data = {
                        name: f.name,
                        size: f.size,
                        type: f.type
                    };

                    let errorMessage = null;
                    if (this.props.accept.length && this.props.accept.indexOf(file.type) === -1) {
                        errorMessage = t`Unsupported file type ({type})`({ type: file.type });
                    } else if (this.props.sizeLimit < file.size) {
                        errorMessage = t`File is too big`;
                    }

                    if (!errorMessage) {
                        data.data = e.target.result;
                        output.push(data);
                    } else {
                        data.message = errorMessage;
                        errors.push(data);
                    }

                    if (loadedFiles === files.length) {
                        this.props.onChange.apply(
                            this,
                            this.props.multiple
                                ? [output, errors]
                                : [output[0] || null, errors[0] || null]
                        );
                        this.reset();
                    }
                };
            })(file);

            if (this.props.readAs === "binary") {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    render() {
        return (
            <input
                ref={ref => (this.dom = ref)}
                accept={this.props.accept}
                style={{ display: "none" }}
                type="file"
                multiple={this.props.multiple}
                onChange={this.onChange}
            />
        );
    }
}

FileReader.defaultProps = {
    accept: [],
    multiple: false,
    sizeLimit: 2097152, // 10485760
    readAs: "data", // data || binary
    onChange: _.noop,
    onReady: _.noop
};

export default createComponent(FileReader);
