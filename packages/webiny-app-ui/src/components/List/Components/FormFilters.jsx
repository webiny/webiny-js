import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-app';

class FormFilters extends React.Component {

    constructor(props) {
        super(props);

        ['submit', 'applyFilters'].map(m => this[m] = this[m].bind(this));
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }

    applyFilters(filters) {
        this.props.onFilter(filters);
    }

    submit({ model, form }) {
        if (typeof this.props.onSubmit === "function") {
            this.props.onSubmit({ model, form, apply: this.applyFilters });
        } else {
            this.applyFilters(model);
        }
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Form } = this.props;

        return (
            <Form
                defaultModel={this.props.defaultModel}
                model={this.props.filters}
                onSubmit={this.submit}
            >
                {({ form }) => this.props.children({
                    apply: () => () => form.submit(),
                    reset: () => () => this.applyFilters({})
                })}
            </Form>
        );
    }
}

FormFilters.defaultProps = {
    defaultModel: null,
    onSubmit({ model, form, apply }) {
        apply(model);
    }
};

export default createComponent(FormFilters, { modules: ['Form'], listFiltersComponent: true });