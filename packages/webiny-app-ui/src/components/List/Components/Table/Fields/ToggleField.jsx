import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class ToggleField extends React.Component {
    render() {
        const { modules: { ChangeConfirm, Switch, List }, render, ...tdProps } = this.props;

        if (render) {
            return render.call(this);
        }

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
            disabled: _.isFunction(this.props.disabled)
                ? this.props.disabled(this.props.data)
                : this.props.disabled
        };

        return (
            <List.Table.Field {...tdProps}>
                {() => (
                    <ChangeConfirm message={this.props.message}>
                        {({ showConfirmation }) => (
                            <Switch {...props} onChange={value => showConfirmation(value, props.onChange)} />
                        )}
                    </ChangeConfirm>
                )}
            </List.Table.Field>
        );
    }
}

ToggleField.defaultProps = {
    message: null,
    onChange: null,
    disabled: false
};

export default createComponent(ToggleField, {
    modules: ["List", "ChangeConfirm", "Switch"],
    tableField: true
});
