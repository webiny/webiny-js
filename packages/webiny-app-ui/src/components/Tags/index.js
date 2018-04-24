import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import { validation } from "webiny-validation";
import styles from "./styles.css?prefix=Tags";

const t = i18n.namespace("Webiny.Ui.Tags");
class Tags extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState
        };

        ["focusTagInput", "removeTag", "handleKeyboard", "validateTag", "addTag"].map(
            m => (this[m] = this[m].bind(this))
        );
    }

    componentDidMount() {
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

    async addTag(value) {
        if (this.tagExists(value)) {
            return;
        }

        let tags = this.props.value;
        if (!_.isArray(tags)) {
            tags = [];
        }

        try {
            await this.validateTag(value);
            tags.push(value);
            this.props.onChange(tags);
        } catch (e) {
            this.props.onInvalidTag({ value: this.tagInput.value, event: e });
        }
    }

    tagExists(tag) {
        return _.find(this.props.value, data => data === tag);
    }

    async handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            return;
        }

        let tags = this.props.value;

        // If user pressed backspace or delete, and the value of input is empty, it means we must delete lastly added tag.
        // Number 8 represents backspace press, and 46 delete press.
        if (e.keyCode === 8 || e.keyCode === 46) {
            if (!this.tagInput.value) {
                this.removeTag(_.findLastIndex(tags));
            }
            return;
        }

        // This means user types a letter. Only Tab and Enter presses are handled as add action.
        if (e.key !== "Tab" && e.key !== "Enter") {
            return;
        }

        // This means user pressed Tab or Enter, so let's add current value to the list.
        e.preventDefault();
        e.stopPropagation();

        if (!this.tagInput.value) {
            return this.validateTag();
        }

        await this.addTag();

        // Reset current value in the input;
        this.tagInput.value = "";
        this.setState({ tag: "" });
    }

    validateTag(value = null) {
        if (typeof this.props.validate === "string") {
            return validation.validate(value, this.props.validateTags);
        }
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { FormGroup },
            styles
        } = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <div className={styles.container} onClick={this.focusTagInput}>
                    <div className={styles.tag}>
                        {_.isArray(this.props.value) &&
                            this.props.value.map((value, index) =>
                                this.props.renderTag.call(this, { value, index })
                            )}
                        {this.props.renderInput.call(this, { styles, component: this })}
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
    renderInput({ styles }) {
        const input = {
            type: "text",
            className: styles.input,
            ref: tagInput => (this.tagInput = tagInput),
            onKeyDown: this.handleKeyboard,
            placeholder: this.props.placeholder,
            onBlur: this.props.validate,
            readOnly: _.get(this.props, "readOnly", false)
        };

        return <input {...input} />;
    },
    renderTag({ value, index }) {
        const {
            modules: { Icon },
            styles
        } = this.props;
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
