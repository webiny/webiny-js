import React from 'react';
import _ from 'lodash';
import { Component } from 'webiny-client';

@Component({ modules: ['Form'], listFiltersComponent: true })
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

    submit(model) {
        if (typeof this.props.onSubmit === "function") {
            this.props.onSubmit({ model, apply: this.applyFilter });
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
                model={this.props.filter}
                onSubmit={this.submit}
            >
                {({ form }) => this.props.children({
                    apply: () => () => form.submit(),
                    reset: () => () => this.applyFilter({}),
                    Bind: form.registerComponent
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

export default FormFilters;