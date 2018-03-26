import React from "react";
import _ from "lodash";
import { createComponent, ApiComponent } from "webiny-client";
import { FormComponent } from "webiny-client-ui";
import axios from "axios";

class OptionComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            options: [],
            loading: false
        };

        this.mounted = false;
        this.cancelRequest = null;

        this.loadOptions = this.loadOptions.bind(this);
        this.normalizeOptions = this.normalizeOptions.bind(this);
        this.setFilters = this.setFilters.bind(this);
        this.applyFilter = this.applyFilter.bind(this);

        if (this.props.filterBy) {
            // Assume the most basic form of filtering (single string)
            let name = this.props.filterBy;
            let filter = this.props.filterBy;
            let loadIfEmpty = false;

            // Check if filterBy is defined as array (0 => name of the input to watch, 1 => filter by field)
            if (_.isArray(this.props.filterBy)) {
                name = this.props.filterBy[0];
                filter = this.props.filterBy[1];
            }

            // Check if filterBy is defined as object
            if (_.isPlainObject(this.props.filterBy)) {
                name = this.props.filterBy.name;
                filter = this.props.filterBy.filter;
                loadIfEmpty = _.get(this.props.filterBy, "loadIfEmpty", loadIfEmpty);
            }

            this.filterName = name;
            this.filterField = filter;
            this.filterLoadIfEmpty = loadIfEmpty;

            this.unwatch = this.props.form.watch(name, newValue =>
                this.applyFilter(newValue, name, filter, loadIfEmpty)
            );
        }
    }

    componentDidMount() {
        this.mounted = true;
        if (
            !this.props.filterBy ||
            this.props.value !== null ||
            (this.filterName && this.props.form.getModel(this.filterName))
        ) {
            this.loadOptions(this.props);
        }
    }

    componentWillReceiveProps(props) {
        const pick = ["options", "children"];
        const oldProps = _.pick(this.props, pick);
        const newProps = _.pick(props, pick);
        if (!_.isEqual(newProps, oldProps) && !this.props.api) {
            this.loadOptions(props);
        }
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.unwatch) {
            this.unwatch();
        }

        if (this.cancelRequest) {
            this.cancelRequest();
        }
    }

    applyFilter(newValue, name, filter, loadIfEmpty) {
        if (newValue === null && !loadIfEmpty) {
            this.setState({ options: [] });
            this.props.onChange(null);
            return;
        }

        // If filter is a function, it needs to return a config for api created using new value
        if (_.isFunction(filter)) {
            const config = filter(newValue, this.props.api);
            if (_.isPlainObject(config)) {
                this.setFilters(config);
            } else {
                this.loadOptions();
            }
        } else {
            // If filter is a string, create a filter object using that string as field name
            const filters = {};
            filters[filter] = _.isObject(newValue) ? newValue.id : newValue;
            this.setFilters(filters);
        }
    }

    setFilters(filters) {
        this.props.api.defaults.params = { ...this.props.api.defaults.params, ...filters };
        this.loadOptions();
        return this;
    }

    loadOptions(props = null) {
        let options = [];
        if (!props) {
            props = this.props;
        }

        if (props.options) {
            if (_.isPlainObject(props.options)) {
                _.each(props.options, (value, key) => {
                    options.push({
                        id: key,
                        text: value
                    });
                });
            }

            if (_.isArray(props.options)) {
                options = this.normalizeOptions(props, props.options);
            }

            return this.setState({ options });
        }

        if (this.props.api) {
            const query = {};
            if (this.props.filterBy) {
                // Get current value of the field that filters current field
                let filter = null;
                const filteredByValue = this.props.form.getModel(this.filterName);

                // Do not load options if `loadIfEmpty` is not defined
                if (!filteredByValue && filteredByValue !== false && !this.filterLoadIfEmpty) {
                    return null;
                }

                if (_.isFunction(this.filterField)) {
                    filter = this.filterField(filteredByValue, this.props.api);
                    if (_.isPlainObject(filter)) {
                        _.merge(query, filter);
                    }
                }

                if (_.isString(this.filterField)) {
                    query[this.filterField] = filteredByValue;
                }

                this.props.api.defaults.params = { ...this.props.api.defaults.params, ...query };
            }

            this.setState({ loading: true });
            this.request = this.props.api
                .request({
                    cancelToken: new axios.CancelToken(cancel => {
                        this.cancelRequest = cancel;
                    })
                })
                .then(apiResponse => {
                    this.request = null;
                    this.cancelRequest = null;

                    let { data } = apiResponse.data;
                    if (_.isPlainObject(data) && Array.isArray(data.list)) {
                        data = data.list;
                    }

                    if (this.props.prepareLoadedData) {
                        data = this.props.prepareLoadedData({ data });
                    }

                    this.setState({ options: this.normalizeOptions(props, data), loading: false });
                })
                .catch(err => {
                    if (axios.isCancel(err)) {
                        return this.mounted ? this.setState({ loading: false }) : null;
                    }
                    console.log(err);
                });

            return this.request;
        }

        /**
         * Check options defined using <option> element.
         * Since this is a HOC, we need to access the actual UI component's children.
         * As a reminder, the structure looks like this:
         *
         * <OptionComponent> <-- this is where we currently are
         *     <Select>
         *         <option value={x}>Label X</option>
         *         <option value={y}>Label Y</option>
         *     </Select>
         * </OptionComponent>
         */
        const uiElement = props.children;

        if (uiElement.props.children) {
            React.Children.map(uiElement.props.children, child => {
                if (child.type === "option") {
                    options.push({
                        id: child.props.value,
                        text: this.renderOptionText(uiElement.props, child.props.children)
                    });
                }
            });
            return this.setState({ options });
        }
    }

    normalizeOptions(props, data) {
        const options = [];
        _.each(data, (option, key) => {
            if (_.isString(key) && (_.isString(option) || _.isNumber(option))) {
                options.push({ id: key, text: "" + option, data: null });
                return;
            }

            const id = _.isPlainObject(option) ? option[props.valueAttr || "id"] : "" + option;
            const text = this.renderOptionText(props, option);
            // Add data to option so we can run it through selectedRenderer when item selection changes
            options.push({ id, text, data: option });
        });

        return options;
    }

    renderOptionText(props, option) {
        if (props.optionRenderer) {
            return props.optionRenderer({ option: { data: option } });
        } else if (_.isPlainObject(option) && !React.isValidElement(option)) {
            return _.get(option, props.textAttr);
        } else if (_.isString(option)) {
            return option;
        }
        return _.isArray(option) ? option[0] : option;
    }

    render() {
        return React.cloneElement(this.props.children, {
            ..._.omit(this.props, ["children"]),
            options: this.state.options
        });
    }
}

OptionComponent.defaultProps = {
    valueAttr: "id", // Attribute to use as option value (when option is a an object, usually used with API)
    textAttr: "name", // Attribute to use as option text (when option is a an object, usually used with API)
    useDataAsValue: false, // Will assign selected/checked value in form of data (usually from API)
    valueKey: null, // used only for rendering to map complex options to model values (only used when component value is an object)
    filterBy: null,
    prepareLoadedData: null
};

export default createComponent([OptionComponent, ApiComponent, FormComponent]);
