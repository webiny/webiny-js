import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Ui.File
 */
class SimpleFile extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);
        this.bindMethods('fileChanged,filesChanged,getFiles,clearFiles');
    }

    clearFiles() {
        this.props.onChange(null).then(() => {
            this.setState({isValid: null});
        });
    }

    fileChanged(file, error) {
        if (error) {
            this.setState({error});
            return;
        }

        if (_.has(file, 'src')) {
            this.props.onChange(file).then(this.validate);
        }
    }

    filesChanged(files, errors) {
        if (errors.length > 0) {
            this.setState({errors});
        }

        if (files.length > 0) {
            this.props.onChange(files).then(this.validate);
        }
    }

    getFiles(e) {
        this.setState({error: null, errors: null});
        e.stopPropagation();
        if (this.props.onGetFiles) {
            this.props.onGetFiles({$this: this});
            return;
        }
        this.reader.getFiles();
    }

    renderValue() {
        if (this.props.multiple) {
            return this.props.value ? Webiny.I18n('{files|count:1:file:default:files} selected', {files: _.get(this.props.value, 'length', 0)}) : '';
        }

        return _.get(this.props.value, 'name', '');
    }
}

SimpleFile.defaultProps = Webiny.Ui.FormComponent.extendProps({
    accept: [],
    multiple: false,
    sizeLimit: 2485760,
    readAs: 'data', // or binary
    onGetFiles: null,
    renderError() {
        const {Alert} = this.props;
        return (
            <Alert title={this.i18n('A file could not be selected')} type="error" close>
                <ul>
                    <li><strong>{this.state.error.name}</strong>: {this.state.error.message}</li>
                </ul>
            </Alert>
        );
    },
    renderErrors() {
        const {Alert} = this.props;
        const data = [];
        _.each(this.state.errors, (err, key) => {
            data.push(<li key={key}><strong>{err.name}</strong>: {err.message}</li>);
        });

        return (
            <Alert title={this.i18n('Some files could not be selected')} type="error" close>
                {data && <ul>{data}</ul>}
            </Alert>
        );
    },
    renderer() {
        const {FileReader, FormGroup, styles} = this.props;

        const fileReaderProps = {
            accept: this.props.accept,
            ref: ref => this.reader = ref,
            onChange: this.props.multiple ? this.filesChanged : this.fileChanged,
            multiple: this.props.multiple,
            readAs: this.props.readAs,
            sizeLimit: this.props.sizeLimit
        };
        const fileReader = <FileReader {...fileReaderProps}/>;

        let clearBtn = null;
        if (this.props.value) {
            clearBtn = (
                <div className={[styles.fileBtn, styles.clearBtn, styles.clearBtnIcon].join(' ')} onClick={this.clearFiles}>
                    <span>Clear</span>
                </div>
            );
        }

        let error = null;
        if (this.state.error || this.state.errors) {
            error = this.props.multiple ? this.props.renderErrors.call(this) : this.props.renderError.call(this);
        }

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                <div>{error}</div>
                <div className={styles.wrapper + ' inputGroup'}>
                    <input
                        type="text"
                        placeholder={this.getPlaceholder()}
                        readOnly={true}
                        onClick={this.getFiles}
                        className={styles.input}
                        value={this.renderValue()}
                        onChange={_.noop}/>

                    {clearBtn}
                    <div className={styles.fileBtn + ' ' + styles.uploadBtn} onClick={this.getFiles}>
                        <span>Select</span>
                        {fileReader}
                    </div>
                    {this.renderDescription()}
                    {this.renderValidationMessage()}
                </div>
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(SimpleFile, {modules: ['FileReader', 'FormGroup', 'Alert'], styles});