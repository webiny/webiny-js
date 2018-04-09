import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-app';

class FormFilters extends React.Component {

    constructor(props) {
        super(props);

        ['submit', 'applyFilter'].map(m => this[m] = this[m].bind(this));
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }

    applyFilter(filter) {
        this.props.onFilter(filter);
    }

    submit({ model, form }) {
        if (typeof this.props.onSubmit === "function") {
            this.props.onSubmit({ model, form, apply: this.applyFilter });
        } else {
            this.applyFilter(model);
        }
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Form } = this.props.modules;

        return (
            <Form
                defaultModel={this.props.defaultModel}
                model={this.props.filter}
                onSubmit={this.submit}
            >
                {({ form }) => this.props.children({
                    apply: () => () => form.submit(),
                    reset: () => () => this.applyFilter({})
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