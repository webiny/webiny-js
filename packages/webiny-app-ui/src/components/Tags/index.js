import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import { validation } from "webiny-validation";
import styles from "./styles.css";

const t = i18n.namespace("Webiny.Ui.Tags");
class Tags extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState
        };

        ["focusTagInput", "removeTag", "addTag", "validateTag"].map(
            m => (this[m] = this[m].bind(this))
        );
    }

    componentDidMount() {
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }

        if (this.props.autoFocus) {
            this.tagInput.focus();
        }
    }

    focusTagInput() {
        this.tagInput.focus();
    }

    removeTag(index) {
        const { value } = this.props;
        value.splice(index, 1);
        this.props.onChange(value);
    }

    tagExists(tag) {
        return _.find(this.props.value, data => data === tag);
    }

    async addTag(e) {
        if (e.ctrlKey || e.metaKey) {
            return;
        }
        let tags = this.props.value;
        const input = this.tagInput;
        const emptyField = !input.value;
        const canRemove = (emptyField && e.keyCode === 8) || e.keyCode === 46;
        const skipAdd = e.key !== "Tab" && e.key !== "Enter";

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

        try {
            await this.validateTag(input.value);
            tags.push(input.value);
            input.value = "";
            this.props.onChange(tags);
            this.setState({ tag: "" });
        } catch (e) {
            this.props.onInvalidTag({ value: input.value, event: e });
        }
    }

    validateTag(value = null) {
        if (typeof this.props.validate === "string") {
            return validation.validate(value, this.props.validateTags);
        }
    }

    renderInput() {
        const input = {
            type: "text",
            className: styles.input,
            ref: tagInput => (this.tagInput = tagInput),
            onKeyDown: this.addTag,
            placeholder: this.props.placeholder,
            onBlur: this.props.validate,
            readOnly: _.get(this.props, "readOnly", false)
        };

        return <input {...input} />;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { FormGroup }, styles } = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <div className={styles.container} onClick={this.focusTagInput}>
                    <div className={styles.tag}>
                        {_.isArray(this.props.value) &&
                            this.props.value.map((value, index) =>
                                this.props.renderTag.call(this, { value, index })
                            )}
                        {this.renderInput()}
                    </div>
                </div>
                {this.props.renderDescription.call(this)}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

Tags.defaultProps = {
    autoFocus: false,
    validateTags: null,
    placeholder: t`Type and hit ENTER`,
    onInvalidTag: _.noop,
    renderTag({ value, index }) {
        const { modules: { Icon }, styles } = this.props;
        return (
            <div key={value} className={styles.block}>
                <p>{value}</p>
                <Icon icon="times" onClick={() => this.removeTag(index)} />
            </div>
        );
    }
};

export default createComponent([Tags, FormComponent], {
    modules: ["Icon", "FormGroup"],
    styles
});
