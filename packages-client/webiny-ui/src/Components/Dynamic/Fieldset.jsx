import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Row from './Row';
import Header from './Header';
import Empty from './Empty';

function insertKey(data) {
    if (!data) {
        data = [];
    }

    const model = {};
    _.each(data, (object, i) => {
        if (_.isArray(object)) {
            object = {};
        }
        if (!_.has(object, '$key')) {
            const $key = _.uniqueId('dynamic-fieldset-');
            object['$key'] = $key;
            model[$key] = object;
        } else {
            model[object['$key']] = object;
        }
        model[object['$key']]['$index'] = i;
    });

    return model;
}

class Fieldset extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        this.currentKey = 0;
        this.rowTemplate = null;
        this.headerTemplate = _.noop;
        this.emptyTemplate = null;

        this.actions = {
            add: (record = null) => () => this.addData(record),
            remove: record => () => this.removeData(record)
        };

        this.bindMethods('parseLayout', 'registerInputs', 'registerInput', 'addData', 'removeData');
    }

    componentWillMount() {
        super.componentWillMount();
        this.setState({model: insertKey(_.cloneDeep(this.props.value))});
        this.parseLayout(this.props.children);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (props.form.isSubmitDisabled()) {
            // prevent modifying model and updating keys if props are received during form submit
            return;
        }

        this.setState({model: insertKey(_.cloneDeep(props.value))});
        this.parseLayout(props.children);
    }

    parseLayout(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }

        React.Children.map(children, child => {
            if (Webiny.isElementOfType(child, Row)) {
                this.rowTemplate = child.props.children;
            }

            if (Webiny.isElementOfType(child, Header)) {
                this.headerTemplate = child.props.children;
            }

            if (Webiny.isElementOfType(child, Empty)) {
                this.emptyTemplate = child.props.children;
            }
        });
    }

    removeData(record) {
        delete this.state.model[record.$key];
        this.props.onChange(_.values(this.state.model));
    }

    addData(record = null) {
        const $key = _.uniqueId('dynamic-fieldset-');
        if (!record) {
            this.state.model[$key] = {$key};
            this.props.onChange(_.values(this.state.model));
        } else {
            const model = _.values(this.state.model);
            model.splice(record.$index + 1, 0, {$key});
            this.props.onChange(model);
        }
    }

    registerInput(child) {
        if (typeof child !== 'object' || child === null) {
            return child;
        }

        if (child.props && child.props.name) {
            const $key = this.currentKey;
            const newProps = _.assign({}, child.props, {
                __tabs: this.props.__tabs,
                attachToForm: this.props.attachToForm,
                attachValidators: this.props.attachValidators,
                detachFromForm: this.props.detachFromForm,
                validateInput: this.props.validateInput,
                form: this.props.form,
                value: _.get(this.state.model, $key + '.' + child.props.name),
                name: $key + '.' + child.props.name,
                onChange: newValue => {
                    _.set(this.state.model, $key + '.' + child.props.name, newValue);
                    this.props.onChange(_.values(this.state.model));
                }
            });

            return React.cloneElement(child, newProps);
        }
        return React.cloneElement(child, _.omit(child.props, ['key', 'ref']), this.registerInputs(child.props && child.props.children));
    }

    registerInputs(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }
        return React.Children.map(children, this.registerInput);
    }
}

Fieldset.defaultProps = {
    defaultValue: [],
    renderer() {
        const model = this.state.model;
        if (Object.keys(model).length) {
            return (
                <div>
                    {this.headerTemplate({actions: this.actions})}
                    {Object.keys(model).map(key => {
                        const record = model[key];
                        this.currentKey = key;
                        return (
                            <webiny-dynamic-fieldset-row key={key}>
                                {this.registerInputs(this.rowTemplate({data: record, actions: this.actions}))}
                            </webiny-dynamic-fieldset-row>
                        );
                    })}
                </div>
            );
        }

        return (
            <div>
                {this.registerInputs(this.emptyTemplate({actions: this.actions}))}
            </div>
        );
    }
};

export default Webiny.createComponent(Fieldset);