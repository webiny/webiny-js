import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import crud from "./../utils/crud";

class GraphQLOptions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            options: [],
            loading: false
        };

        this.resolves = {};
        this.mounted = false;

        this.loadOptions = this.loadOptions.bind(this);
        this.loadById = this.loadById.bind(this);
        this.normalizeOption = this.normalizeOption.bind(this);
    }

    componentWillMount() {
        // Prepare actions
        const { entity, fields, searchOnly } = this.props;
        let { actions } = this.props;

        if (entity) {
            actions = actions || {};
            actions.list = actions.list || crud.createListQuery(entity, fields);
            actions.get = actions.get || crud.createGetQuery(entity, fields);
        }

        this.actions = actions;

        !searchOnly &&
            this.loadOptions({
                perPage: this.props.perPage || 10,
                page: this.props.page || 1,
                sort: { ...this.props.sort },
                filter: { ...this.props.filter },
                search: { ...this.props.search }
            });
    }

    componentWillReceiveProps(props) {
        let shouldLoad = false;

        const propKeys = ["sort", "filter", "perPage", "page", "search"];
        if (!_.isEqual(_.pick(props, propKeys), _.pick(this.props, propKeys))) {
            shouldLoad = true;
        }

        const { search, searchOnly } = props;
        if (search && _.isEmpty(search.query) && searchOnly) {
            shouldLoad = false;
            this.setState({ options: [] });
        }

        if (shouldLoad) {
            this.loadOptions({
                perPage: props.perPage || 10,
                page: props.page || 1,
                sort: { ...props.sort },
                filter: { ...props.filter },
                search: { ...props.search }
            });
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    loadOptions(query) {
        this.setState({ loading: true });

        return this.actions
            .list({ fields: this.props.fields, variables: query })
            .then(({ data }) => {
                if (_.isPlainObject(data) && Array.isArray(data.list)) {
                    data = data.list;
                }

                this.setState({ options: data.map(this.normalizeOption), loading: false });
            });
    }

    loadById(value) {
        if (typeof value === "string") {
            if (this.resolves[value]) {
                return Promise.resolve(this.resolves[value]);
            }

            return (this.resolves[value] = this.actions
                .get({ fields: this.props.fields, variables: { id: value } })
                .then(({ data }) => {
                    return (this.resolves[value] = this.normalizeOption(data));
                }));
        }

        return Promise.resolve(value);
    }

    normalizeOption(option) {
        const { valueField } = this.props;
        const value = _.isPlainObject(option) ? option[valueField || "id"] : "" + option;
        const label = this.renderOptionText(option);
        // Add data to option so we can run it through renderSelected when item selection changes
        return { value, label, data: { ...option } };
    }

    renderOptionText(option) {
        const { renderOption, labelField } = this.props;
        if (renderOption) {
            return renderOption({ option: { data: option } });
        } else if (_.isPlainObject(option) && !React.isValidElement(option)) {
            return _.get(option, labelField);
        } else if (_.isString(option)) {
            return option;
        }
        return _.isArray(option) ? option[0] : option;
    }

    render() {
        return this.props.children({
            options: this.state.options,
            loading: this.state.loading,
            loadById: this.loadById
        });
    }
}

GraphQLOptions.defaultProps = {
    searchOnly: false,
    valueField: "id", // Attribute to use as option value (when option is a an object, usually used with API)
    labelField: "name", // Attribute to use as option text (when option is a an object, usually used with API)
    valueKey: null // used only for rendering to map complex options to model values (only used when component value is an object)
};

export default createComponent(GraphQLOptions);
