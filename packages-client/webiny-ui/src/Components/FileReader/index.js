import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.FileReader
 */
class FileReader extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.reset = () => {
            ReactDOM.findDOMNode(this).value = null;
        };

        this.bindMethods('onChange', 'getFiles', 'readFiles');
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.reset = _.noop;
    }

    getFiles() {
        ReactDOM.findDOMNode(this).click();
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

            reader.onloadend = ((f) => {
                return (e) => {
                    loadedFiles++;
                    const data = {
                        name: f.name,
                        size: f.size,
                        type: f.type
                    };

                    let errorMessage = null;
                    if (this.props.accept.length && this.props.accept.indexOf(file.type) === -1) {
                        errorMessage = this.i18n('Unsupported file type ({type})', {type: file.type});
                    } else if (this.props.sizeLimit < file.size) {
                        errorMessage = this.i18n('File is too big');
                    }

                    if (!errorMessage) {
                        data.src = e.target.result;
                        output.push(data);
                    } else {
                        data.message = errorMessage;
                        errors.push(data);
                    }


                    if (loadedFiles === files.length) {
                        this.props.onChange.apply(this, this.props.multiple ? [output, errors] : [output[0] || null, errors[0] || null]);
                        this.reset();
                    }
                };
            })(file);

            if (this.props.readAs === 'binary') {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }
}

FileReader.defaultProps = {
    accept: [],
    multiple: false,
    sizeLimit: 2097152, // 10485760
    readAs: 'data', // data || binary
    onChange: _.noop,
    renderer() {
        return (
            <input
                accept={this.props.accept}
                style={{display: 'none'}}
                type="file"
                multiple={this.props.multiple}
                onChange={this.onChange}/>
        );
    }
};

export default Webiny.createComponent(FileReader, {api: ['getFiles', 'readFiles']});