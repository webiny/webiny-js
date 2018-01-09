import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ToggleField extends Webiny.Ui.Component {

}

ToggleField.defaultProps = {
    message: null,
    onChange: null,
    disabled: false,
    renderer() {
        const props = {
            onChange: newValue => {
                if (_.isNull(this.props.onChange)) {
                    const attributes = {};
                    _.set(attributes, this.props.name, newValue);
                    this.props.actions.update(this.props.data.id, attributes);
                } else {
                    this.props.onChange(newValue);
                }
            },
            value: _.get(this.props.data, this.props.name),
            disabled: _.isFunction(this.props.disabled) ? this.props.disabled(this.props.data) : this.props.disabled
        };

        const {ChangeConfirm, Switch, List, ...tdProps} = this.props;

        return (
            <List.Table.Field {..._.omit(tdProps, ['renderer'])}>
                {() => (
                    <ChangeConfirm message={this.props.message}>
                        <Switch {...props}/>
                    </ChangeConfirm>
                )}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(ToggleField, {modules: ['List', 'ChangeConfirm', 'Switch'], tableField: true});