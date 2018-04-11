import React from "react";
import _ from "lodash";
import warning from "warning";
import classSet from "classnames";
import { i18n, createComponent, ApiComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

const t = i18n.namespace("Webiny.Ui.Search");
class Search extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState,
            query: "", // Value being searched
            preview: "", // Rendered value of selected value
            options: [],
            loading: false,
            selectedOption: -1, // Selected option index
            selectedData: null // Delected item data
        };

        this.mounted = false;
        this.preventBlur = false;
        this.delay = null;
        this.currentValueIsId = false;
        this.filters = {};
        this.unwatch = _.noop;

        [
            "loadOptions",
            "inputChanged",
            "selectItem",
            "selectCurrent",
            "onKeyUp",
            "onBlur",
            "renderPreview",
            "fetchValue",
            "getCurrentData",
            "applyFreeInput"
        ].map(m => (this[m] = this[m].bind(this)));

        if (this.props.filterBy) {
            // Assume the most basic form of filtering (single string)
            let name = this.props.filterBy;
            let filter = this.props.filterBy;

            // Check if filterBy is defined as array (0 => name of the input to watch, 1 => filter by field)
            if (_.isArray(this.props.filterBy)) {
                name = this.props.filterBy[0];
                filter = this.props.filterBy[1];
            }

            // Check if filterBy is defined as object
            if (_.isPlainObject(this.props.filterBy)) {
                name = this.props.filterBy.name;
                filter = this.props.filterBy.filter;
            }

            this.unwatch = this.props.form.watch(name, newValue =>
                this.applyFilter(newValue, name, filter)
            );
        }
    }

    componentWillReceiveProps(props) {
        if (_.isEqual(props.value, this.props.value)) {
            return;
        }

        this.normalizeValue(props);
    }

    componentWillMount() {
        this.normalizeValue(this.props);
    }

    componentDidMount() {
        this.mounted = true;
        this.props.attachToForm && this.props.attachToForm(this);
    }

    componentWillUnmount() {
        this.mounted = false;
        this.unwatch();
    }

    /** Custom methods */

    /**
     * We support 3 types of values:
     * - id
     * - object
     * - random string
     *
     * @param props
     */
    normalizeValue(props) {
        const value = props.value;

        const newState = {
            options: [],
            selectedOption: -1,
            query: ""
        };

        // Try to extract ID
        let id = null;
        if (value && _.isString(value) && value.match(/^[0-9a-fA-F]{24}$/)) {
            id = value;
        } else if (value && _.isPlainObject(value)) {
            id = value.id;
            newState["selectedData"] = value;
        }

        if (!id && value) {
            newState["preview"] = value;
        } else if (id && _.isPlainObject(value)) {
            newState["preview"] = this.renderPreview(value);
        } else if (id) {
            this.props.api.get({ variables: { id: value } }).then(({ data }) => {
                this.setState({ selectedData: data, preview: this.renderPreview(data) });
            });
        }

        this.currentValueIsId = !!id;
        this.setState(newState);
    }

    getCurrentData() {
        return this.state.selectedData;
    }

    applyFilter(newValue, name, filter) {
        // If filter is a function, it needs to return a config for api created using new value
        if (_.isFunction(filter)) {
            this.filters = filter(newValue);
        } else {
            // If filter is a string, create a filter object using that string as field name
            const filters = {};
            filters[filter] = _.isObject(newValue) ? newValue.id : newValue;
            this.filters = filters;
        }
        this.filters = _.pickBy(this.filters, v => !_.isNull(v) && !_.isUndefined(v) && v !== "");
    }

    loadOptions(query) {
        this.setState({ query });
        clearTimeout(this.delay);

        this.delay = setTimeout(() => {
            if (
                _.isEmpty(this.state.query) ||
                this.state.query.length < this.props.minQueryLength
            ) {
                return;
            }

            if (this.mounted) {
                this.setState({ loading: true });
                this.props.api
                    .list({
                        variables: {
                            search: {
                                query: this.state.query,
                                fields: this.props.search.fields || ["name"],
                                operator: this.props.search.operator || "or"
                            },
                            filter: { ...this.filters }
                        }
                    })
                    .then(({ data }) => {
                        this.setState(
                            { options: _.get(data, "list", data), loading: false },
                            () => {
                                this.props.onLoadOptions({ options: this.state.options });
                            }
                        );
                    });
            }
        }, this.props.allowFreeInput ? 300 : 500);
    }

    inputChanged(e) {
        if (this.props.value && this.currentValueIsId && this.props.allowFreeInput) {
            this.props.onChange(e.target.value);
        }
        this.setState({
            query: e.target.value,
            preview: "",
            selectedData: null
        });
        if (e.target.value.length >= 2) {
            this.loadOptions(e.target.value);
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
                    // Reset only if it is a selected value with valid mongo ID or data object
                    const id = _.get(this.props, "value");
                    if (
                        this.props.allowFreeInput &&
                        _.isString(id) &&
                        !id.match(/^[0-9a-fA-F]{24}$/)
                    ) {
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
                if (this.state.options.length > 0) {
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
            const state = { options: [] };
            if (!_.get(this.props, "value")) {
                state["query"] = "";
                state["selectedOption"] = -1;
            }
            this.setState(state, this.props.validate);
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

    selectItem(item) {
        this.preventBlur = true;
        this.setState(
            {
                selectedOption: -1,
                query: "",
                options: [],
                preview: this.renderPreview(item),
                selectedData: item
            },
            () => {
                this.props.onChange(this.props.useDataAsValue ? item : item[this.props.valueAttr]);
                setTimeout(this.props.validate, 10);
                this.preventBlur = false;
            }
        );
    }

    selectNext() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.selectedOption + 1;
        if (selected >= this.state.options.length) {
            selected = this.state.options.length - 1;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.state.options[selected])
        });
    }

    selectPrev() {
        if (!this.state.options.length) {
            return;
        }

        let selected = this.state.options.length - 1;
        if (this.state.selectedOption <= selected) {
            selected = this.state.selectedOption - 1;
        }

        if (selected < 0) {
            selected = 0;
        }

        this.setState({
            selectedOption: selected,
            preview: this.renderPreview(this.state.options[selected])
        });
    }

    selectCurrent() {
        if (!this.state.options.length) {
            return;
        }

        if (this.state.selectedOption === -1) {
            return;
        }

        const current = this.state.options[this.state.selectedOption];
        this.selectItem(current);
    }

    reset() {
        this.setState(
            {
                selectedOption: -1,
                query: "",
                preview: "",
                options: [],
                selectedData: null
            },
            () => {
                this.props.onChange(null);
                this.props.onReset();
            }
        );
    }

    fetchValue({ data: item }) {
        let value = _.get(item, this.props.textAttr, item.id);

        warning(
            value,
            `Warning: Item attribute '${this.props.textAttr}' was not found in the results of '${
                this.props.name
            }' component.\nMissing or misspelled 'fields' parameter?`
        );

        return value;
    }

    renderPreview(item) {
        if (!item) {
            return null;
        }
        return this.props.renderSelected.call(this, { option: { data: item } });
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
    searchOperator: "or",
    valueAttr: "id",
    textAttr: "name",
    minQueryLength: 2,
    onEnter: _.noop,
    onChange: _.noop,
    onReset: _.noop,
    onLoadOptions: _.noop,
    inputIcon: "search",
    loadingIcon: "search",
    placeholder: t`Type to search`,
    useDataAsValue: false,
    allowFreeInput: false,
    renderOptionLabel({ option }) {
        const value = this.fetchValue(option);
        const content = { __html: value.replace(/\s+/g, "&nbsp;") };
        return <div dangerouslySetInnerHTML={content} />;
    },
    renderSelected({ option }) {
        return this.fetchValue(option);
    },
    renderOption({ item, index }) {
        const { styles } = this.props;
        const itemClasses = {
            [styles.selected]: index === this.state.selectedOption
        };

        const linkProps = {
            onMouseDown: () => this.selectItem(item),
            onMouseOver: () =>
                this.setState({ selectedOption: index, preview: this.renderPreview(item) })
        };

        return (
            <li key={index} className={classSet(itemClasses)} {...linkProps}>
                <a href="javascript:void(0)">
                    {this.props.renderOptionLabel.call(this, { option: { data: item } })}
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
            value: this.state.query || this.state.preview || "",
            onChange: this.inputChanged,
            disabled: this.props.disabled
        };

        // Render option
        const options = this.state.options.map((item, index) =>
            this.props.renderOption.call(this, { item, index })
        );

        let dropdownMenu = null;
        const { styles } = this.props;
        if (this.state.options.length > 0) {
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

export default createComponent([Search, ApiComponent, FormComponent], {
    modules: ["Link", "Icon", "FormGroup"],
    styles
});
