import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-app";
import ListContext from "./GraphQLListContext";
import crud from "./../utils/operationGenerator";

class GraphQLList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            list: [],
            meta: {},
            loading: false
        };

        this.loadRecords = this.loadRecords.bind(this);
        this.updateRecord = this.updateRecord.bind(this);
        this.deleteRecord = this.deleteRecord.bind(this);
    }

    componentWillMount() {
        // Prepare actions
        const { entity, fields } = this.props;
        let { actions } = this.props;

        if (entity) {
            actions = actions || {};
            actions.list = actions.list || crud.generateList(entity, fields);
            actions.update = actions.update || crud.generateUpdate(entity, fields);
            actions.delete = actions.delete || crud.generateDelete(entity, fields);
        }

        this.actions = actions;

        this.loadRecords(this.props);

        this.props.onReady &&
            this.props.onReady({
                loadRecords: this.loadRecords
            });

        if (this.props.autoRefresh && _.isNumber(this.props.autoRefresh)) {
            this.autoRefresh = setInterval(
                () => this.loadRecords(null, false),
                1000 * this.props.autoRefresh
            );
        }
    }

    componentWillReceiveProps(props) {
        let shouldLoad = false;

        const propKeys = ["sort", "filter", "perPage", "page", "search"];
        if (!_.isEqual(_.pick(props, propKeys), _.pick(this.props, propKeys))) {
            shouldLoad = true;
        }

        if (shouldLoad) {
            this.loadRecords(props);
        }
    }

    loadRecords(props = null, showLoading = true) {
        if (!props) {
            props = this.props;
        }

        const variables = {
            filter: _.pickBy(props.filter, v => !_.isNil(v)),
            sort: props.sort,
            perPage: props.perPage || 10,
            page: props.page || 1
        };

        if (!_.isEmpty(props.search.query)) {
            variables.search = props.search;
        }
        
        if (showLoading) {
            this.setState({ loading: true });
        }

        return this.actions.list({ variables }).then(({ data }) => {
            this.setState({ loading: false, ...data });

            return data;
        });
    }

    updateRecord(id, data) {
        return this.actions
            .update({ variables: { id, data } })
            .then(({ data }) => {
                this.loadRecords();
                return data;
            })
            .catch(({ error }) => {
                app.services
                    .get("growler")
                    .danger(error.message, t`That didn\'t go as expected...`, true);
            });
    }

    deleteRecord(id) {
        return this.actions
            .delete({ variables: { id } })
            .then(({ data }) => {
                return data;
            })
            .catch(({ error }) => {
                app.services
                    .get("growler")
                    .danger(error.message, t`That didn\'t go as expected...`, true);
            });
    }

    render() {
        const { children, ...props } = this.props;

        return children({
            ..._.cloneDeep(props),
            list: this.state.list,
            meta: this.state.meta,
            loading: this.state.loading,
            actions: {
                loadRecords: this.loadRecords,
                updateRecord: this.updateRecord,
                deleteRecord: this.deleteRecord
            }
        });
    }
}

GraphQLList.defaultProps = {
    onReady: _.noop,
    autoRefresh: false
};

export default createComponent([GraphQLList, ListContext]);
