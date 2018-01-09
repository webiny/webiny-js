import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Ui.Tags
 */
class Tags extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.bindMethods('focusTagInput,removeTag,addTag,validateTag');
    }

    componentDidMount() {
        super.componentDidMount();
        if (this.props.autoFocus) {
            this.tagInput.focus();
        }
    }

    focusTagInput() {
        this.tagInput.focus();
    }

    removeTag(index) {
        const {value} = this.props;
        value.splice(index, 1);
        this.props.onChange(value);
    }

    tagExists(tag) {
        return _.find(this.props.value, data => data === tag);
    }

    addTag(e) {
        if (e.ctrlKey || e.metaKey) {
            return;
        }
        let tags = this.props.value;
        const input = this.tagInput;
        const emptyField = !input.value;
        const canRemove = emptyField && e.keyCode === 8 || e.keyCode === 46;
        const skipAdd = e.key !== 'Tab' && e.key !== 'Enter';

        if (canRemove) {
            this.removeTag(_.findLastIndex(tags));
        }

        if (skipAdd) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (emptyField) {
            return this.validateTag();
        }

        if (this.tagExists(input.value)) {
            return;
        }

        if (!_.isArray(tags)) {
            tags = [];
        }

        this.validateTag(input.value).then(() => {
            tags.push(input.value);
            input.value = '';
            this.props.onChange(tags);
            this.setState({tag: ''});
        }).catch(e => {
            this.props.onInvalidTag({value: input.value, event: e});
        });
    }

    validateTag(value = null) {
        return Webiny.Validator.validate(value, this.props.validateTags);
    }
}

Tags.defaultProps = Webiny.Ui.FormComponent.extendProps({
    autoFocus: false,
    validateTags: null,
    placeholder: Webiny.I18n('Type and hit ENTER'),
    onInvalidTag: _.noop,
    renderTag({value, index}) {
        const {Icon, styles} = this.props;
        return (
            <div key={value} className={styles.block}>
                <p>{value}</p>
                <Icon icon="icon-cancel" onClick={() => this.removeTag(index)}/>
            </div>
        );
    },
    renderer() {
        const {FormGroup, styles} = this.props;

        const input = {
            type: 'text',
            className: styles.input,
            ref: tagInput => this.tagInput = tagInput,
            onKeyDown: this.addTag,
            placeholder: this.getPlaceholder(),
            onBlur: this.validate,
            readOnly: _.get(this.props, 'readOnly', false),
        };

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                <div className={styles.container} onClick={this.focusTagInput}>
                    <div className={styles.tag}>
                        {_.isArray(this.props.value) && this.props.value.map((value, index) => (
                            this.props.renderTag.call(this, {value, index})
                        ))}
                        <input {...input}/>
                    </div>
                </div>
                {this.renderDescription()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Tags, {modules: ['Icon', 'FormGroup'], styles});