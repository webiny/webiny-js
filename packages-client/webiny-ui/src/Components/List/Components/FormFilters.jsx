import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Filters from './Filters';

class FormFilters extends Filters {

    constructor(props) {
        super(props);

        this.bindMethods('getFilters,submit,applyFormFilters,resetFormFilters');
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }

    getFilters() {
        return this.form.getModel();
    }

    submit({model, form}) {
        if (_.isFunction(this.props.onSubmit)) {
            this.props.onSubmit({model, form, apply: this.applyFilters});
        } else {
            this.applyFilters(model);
        }
    }

    applyFormFilters() {
        return (e) => this.form.submit({event: e});
    }

    resetFormFilters() {
        return () => this.applyFilters({});
    }
}

FormFilters.defaultProps = {
    defaultModel: null,
    onSubmit({model, form, apply}) {
        apply(model);
    },
    renderer() {
        const {Form} = this.props;

        return (
            <Form ref={ref => this.form = ref} defaultModel={this.props.defaultModel} model={this.props.filters} onSubmit={this.submit}>
                {() => this.props.children({apply: this.applyFormFilters, reset: this.resetFormFilters})}
            </Form>
        );
    }
};

export default Webiny.createComponent(FormFilters, {modules: ['Form']});