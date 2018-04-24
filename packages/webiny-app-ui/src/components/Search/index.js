import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { i18n, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css?prefix=Search";

const t = i18n.namespace("Webiny.Ui.Search");
class Search extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            query: "", // Value being searched
            preview: "", // Rendered value of selected value
            selectedOption: -1, // Selected option index
            selectedData: null // Selected option data
        };

        this.preventBlur = false;

        [
            "inputChanged",
            "selectOption",
            "selectCurrent",
            "onKeyUp",
            "onBlur",
            "renderPreview",
            "applyFreeInput"
        ].map(m => (this[m] = this[m].bind(this)));
    }

    componentWillMount() {
        this.resolveSelected(this.props);
    }

    componentWillReceiveProps(props) {
        this.resolveSelected(props);
    }

    resolveSelected(props) {
        if (!_.isPlainObject(props.value) && props.resolveSelected) {
            props.resolveSelected(props.value).then(option => {
                this.setState({ preview: this.renderPreview(option) });
            });
        }
    }

    inputChanged(e) {
        if (this.props.value && this.props.allowFreeInput) {
            this.props.onChange(e.target.value);
        }
        this.setState({
            query: e.target.value,
            preview: "",
            selectedData: null
        });

        if (e.target.value.length >= this.props.minQueryLength) {
            this.props.onSearch(e.target.value);
        } else {
            this.props.onSearch(null);
        }
    }

    onKeyUp(e) {
        this.key = e.key;

        if (e.metaKey || e.ctrlKey) {
            return;
        }

        switch (this.key) {
            case "Backspace":
                if (_.isEmpty(this.state.query) || _.get(this.props, "value")) {
                    if (this.props.allowFreeInput) {
                        this.inputChanged(e);
                        break;
                    }
                    this.reset();
                    break;
                } else {
                    this.inputChanged(e);
                }
                break;
            case "ArrowDown":
                this.selectNext();
                break;
            case "ArrowUp":
                this.selectPrev();
                break;
            case "Enter":
                e.stopPropagation();
                e.preventDefault();
                if (this.props.options.length > 0) {
                    this.selectCurrent();
                } else if (this.props.allowFreeInput) {
                    this.applyFreeInput();
                } else {
                    this.props.onEnter({ event: e });
                }
                break;
            case "Escape":
                this.onBlur();
                break;
            case "Tab":
            case "ArrowLeft":
            case "ArrowRight":
                break;
            default:
                this.inputChanged(e);
                break;
        }
    }

    onBlur() {
        if (this.preventBlur) {
            return;
        }

        if (!this.props.allowFreeInput) {
            if (!_.get(this.props, "value")) {
                this.props.onSearch(null);
                this.setState({ query: "", selectedOption: -1 }, this.props.validate);
            }
        }

        if (this.props.allowFreeInput) {
            this.applyFreeInput();
        }
    }

    applyFreeInput() {
        if (!this.state.selectedData && !(this.state.query === "" && this.state.preview !== "")) {
            this.props.onChange(this.state.query);
            setTimeout(this.props.validate, 10);
        }
    }

    selectOption(option) {
        this.preventBlur = true;
        this.setState(
            {
                selectedOption: -1,
                query: "",
                preview: this.renderPreview(option),
                selectedData: option
            },
            () => {
                this.props.onChange(this.props.useDataAsValue ? option.data : option.value);
                setTimeout(this.props.validate, 10);
                this.preventBlur = false;
                this.props.onSearch(null);
            }
        );
    }

    selectNext() {
        if (!this.props.options.length) {
            return;
        }

        let selected = this.state.selectedOption + 1;
        if (selected >= this.props.options.length) {
            selected = this.props.options.length - 1;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.props.options[selected])
        });
    }

    selectPrev() {
        if (!this.props.options.length) {
            return;
        }

        let selected = this.props.options.length - 1;
        if (this.state.selectedOption <= selected) {
            selected = this.state.selectedOption - 1;
        }

        if (selected < 0) {
            selected = 0;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.props.options[selected])
        });
    }

    selectCurrent() {
        if (!this.props.options.length) {
            return;
        }

        if (this.state.selectedOption === -1) {
            return;
        }

        const current = this.props.options[this.state.selectedOption];
        this.selectOption(current);
    }

    reset() {
        this.setState(
            {
                selectedOption: -1,
                query: "",
                preview: "",
                selectedData: null
            },
            () => {
                this.props.onChange(null);
                this.props.onReset();
            }
        );
    }

    renderPreview(option) {
        if (!option) {
            return null;
        }
        return this.props.renderSelected.call(this, { option });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { FormGroup } = this.props.modules;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                {this.props.renderInfo.call(this)}

                <div className="inputGroup">
                    {this.props.renderSearchInput.call(this, { $this: this })}
                </div>
                {this.props.renderDescription.call(this)}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

Search.defaultProps = {
    useDataAsValue: true,
    resolveSelected: null, // Use this to resolve scalar values into a data object
    minQueryLength: 2,
    onSearch: _.noop,
    onEnter: _.noop,
    onChange: _.noop,
    onReset: _.noop,
    inputIcon: "search",
    loadingIcon: "search",
    placeholder: t`Type to search`,
    allowFreeInput: false,
    renderOptionLabel({ option }) {
        return <div>{option.value}</div>;
    },
    renderSelected({ option }) {
        return option.label;
    },
    renderOption({ option, index }) {
        const { styles } = this.props;
        const itemClasses = {
            [styles.selected]: index === this.state.selectedOption
        };

        const linkProps = {
            onMouseDown: () => this.selectOption(option),
            onMouseOver: () =>
                this.setState({ selectedOption: index, preview: this.renderPreview(option) })
        };

        return (
            <li key={index} className={classSet(itemClasses)} {...linkProps}>
                <a href="javascript:void(0)">
                    {this.props.renderOptionLabel.call(this, { option })}
                </a>
            </li>
        );
    },
    renderSearchInput() {
        const inputProps = {
            type: "text",
            readOnly: this.props.readOnly || false,
            placeholder: this.props.placeholder,
            autoComplete: "off",
            spellCheck: "false",
            dir: "auto",
            onKeyDown: this.onKeyUp,
            onBlur: this.onBlur,
            value:
                this.state.query ||
                this.state.preview ||
                this.renderPreview(this.props.value) ||
                "",
            onChange: this.inputChanged,
            disabled: this.props.disabled
        };

        // Render option
        const options = this.props.options.map((option, index) =>
            this.props.renderOption.call(this, { option, index })
        );

        let dropdownMenu = null;
        const { styles } = this.props;
        if (this.props.options.length > 0) {
            dropdownMenu = (
                <div className={styles.autosuggest}>
                    <div className={styles.plainSearch}>
                        <ul>{options}</ul>
                    </div>
                </div>
            );
        }

        // Create search input
        const { Link, Icon } = this.props.modules;
        return (
            <div className={styles.search}>
                <Link className={styles.btn}>
                    <Icon
                        className={styles.icon}
                        icon={this.props.loading ? this.props.loadingIcon : this.props.inputIcon}
                    />
                </Link>
                <input {...inputProps} />
                {dropdownMenu}
            </div>
        );
    }
};

export default createComponent([Search, FormComponent], {
    modules: ["Link", "Icon", "FormGroup"],
    styles
});
