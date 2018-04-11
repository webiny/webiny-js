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

        this.mounted = false;

        this.loadOptions = this.loadOptions.bind(this);
        this.normalizeOptions = this.normalizeOptions.bind(this);
    }

    componentWillMount() {
        // Prepare actions
        const { entity, fields } = this.props;
        let { actions } = this.props;

        if (entity) {
            actions = actions || {};
            actions.list = actions.list || crud.createListQuery(entity, fields);
        }

        this.actions = actions;

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

    setSearch({ query }) {
        this.loadOptions({
            perPage: this.props.perPage || 10,
            page: this.props.page || 1,
            sort: { ...this.props.sort },
            filter: { ...this.props.filter },
            search: { ...this.props.search, query }
        });
    }

    loadOptions(query) {
        this.setState({ loading: true });

        return this.actions.list({ fields: props.fields, variables: query }).then(({ data }) => {
            if (_.isPlainObject(data) && Array.isArray(data.list)) {
                data = data.list;
            }

            this.setState({ options: this.normalizeOptions(props, data), loading: false });
        });
    }

    normalizeOptions(props, data) {
        return data.map(option => {
            const id = _.isPlainObject(option) ? option[props.valueAttr || "id"] : "" + option;
            const text = this.renderOptionText(props, option);
            // Add data to option so we can run it through renderSelected when item selection changes
            return { id, text, data: { ...option } };
        });
    }

    renderOptionText(props, option) {
        if (props.renderOption) {
            return props.renderOption({ option: { data: option } });
        } else if (_.isPlainObject(option) && !React.isValidElement(option)) {
            return _.get(option, props.textAttr);
        } else if (_.isString(option)) {
            return option;
        }
        return _.isArray(option) ? option[0] : option;
    }

    render() {
        return this.props.children({
            options: this.state.options,
            loading: this.state.loading,
            setSearch: this.setSearch
        });
    }
}

GraphQLOptions.defaultProps = {
    valueAttr: "id", // Attribute to use as option value (when option is a an object, usually used with API)
    textAttr: "name", // Attribute to use as option text (when option is a an object, usually used with API)
    valueKey: null // used only for rendering to map complex options to model values (only used when component value is an object)
};

export default createComponent(GraphQLOptions);
