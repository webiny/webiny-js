import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-app";
import crud from "./../utils/crud";

class GraphQLForm extends React.Component {
    constructor() {
        super();
        this.state = {
            loading: false,
            error: null,
            model: {}
        };

        this.growler = app.services.get("growler");

        ["onSubmit", "showLoading", "hideLoading"].map(m => (this[m] = this[m].bind(this)));
    }

    componentWillMount() {
        // Prepare actions
        const { entity, fields } = this.props;
        let { actions } = this.props;

        if (entity) {
            actions = actions || {};
            actions.get = actions.get || crud.createGetQuery(entity, fields);
            actions.create = actions.create || crud.createCreateQuery(entity, fields);
            actions.update = actions.update || crud.createUpdateQuery(entity, fields);
        }

        this.actions = actions;

        // Prepare model
        this.loadModel(this.props.id);
    }

    showLoading() {
        this.setState({ loading: true, error: null });
        return this;
    }

    hideLoading() {
        this.setState({ loading: false });
        return this;
    }

    loadModel(id = null) {
        if (!id) {
            if (this.props.withRouter) {
                id = app.router.getParams("id");
            }
        }

        if (id) {
            this.showLoading();

            return this.actions
                .get({ variables: { id } })
                .then(({ data }) => {
                    this.setState({ model: data, loading: false }, () => {
                        // Execute optional `onLoad` callback
                        if (_.isFunction(this.props.onLoad)) {
                            this.props.onLoad({ model: this.state.model });
                        }
                    });
                })
                .catch(error => {
                    if (this.props.onFailure) {
                        this.props.onFailure({ error });
                    }
                });
        }
    }

    onSubmit(model) {
        this.showLoading();

        this.setState({ model });

        if (model.id) {
            return this.actions
                .update({ fields: this.props.fields, variables: { id: model.id, data: model } })
                .then(res => this.processSubmitResponse(model, res))
                .catch(err => this.setError(err));
        }

        return this.actions
            .create({ fields: this.props.fields, variables: { data: model } })
            .then(res => this.processSubmitResponse(model, res))
            .catch(err => this.setError(err));
    }

    processSubmitResponse(model, { data }) {
        this.growler.remove(this.growlId);
        this.hideLoading();

        this.setState({
            model: data,
            error: null
        });

        if (_.isFunction(this.props.onSuccessMessage)) {
            this.growler.success(this.props.onSuccessMessage({ model }));
        }

        const { onSubmitSuccess } = this.props;
        if (_.isFunction(onSubmitSuccess)) {
            return onSubmitSuccess({ model });
        }

        if (_.isString(onSubmitSuccess)) {
            return app.router.goToRoute(onSubmitSuccess);
        }
    }

    setError(error) {
        this.hideLoading();
        this.setState({ error }, () => {
            // error callback
            this.props.onSubmitError({ error });
        });
        return this;
    }

    getInvalidFields() {
        if (!this.state.error) {
            return null;
        }

        const { invalidAttributes = {} } = this.state.error.data;
        const simplified = {};
        _.each(invalidAttributes, (value, key) => {
            simplified[key] = value.data.message;
        });
        return simplified;
    }

    render() {
        return this.props.children({
            model: _.cloneDeep(this.state.model),
            onSubmit: this.onSubmit,
            loading: this.state.loading,
            error: this.state.error,
            invalidFields: this.getInvalidFields()
        });
    }
}

GraphQLForm.defaultProps = {
    withRouter: false,
    onSubmitSuccess: null,
    onSubmitError: _.noop,
    onFailure: _.noop,
    onLoad: _.noop,
    onSuccessMessage() {
        return "Your record was saved successfully!";
    }
};

export default createComponent(GraphQLForm);
