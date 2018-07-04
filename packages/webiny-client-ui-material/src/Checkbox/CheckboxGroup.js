// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import type Checkbox from "./Checkbox";

type Props = FormComponentProps & {
    // Form element's label.
    label?: string,

    // Form element's description.
    description?: string,

    // An array of Checkbox components.
    children: ({
        onChange: (id: string | number) => () => void
    }) => React.ChildrenArray<React.Element<Checkbox>>
};

class CheckboxGroup extends React.Component<Props> {
    render() {
        const { description, validation = { isValid: null } } = this.props;

        return (
            <React.Fragment>
                {this.props.label}
                <br />
                {this.props.children({
                    onChange: id => {
                        return () => {
                            const values = Array.isArray(this.props.value) ? this.props.value : [];
                            const index = values.indexOf(id);
                            if (index > -1) {
                                values.splice(index, 1);
                            } else {
                                values.push(id);
                            }

                            this.props.onChange(values);
                        };
                    },
                    getValue: id => {
                        const values = Array.isArray(this.props.value) ? this.props.value : [];
                        return values.includes(id);
                    }
                })}
                {validation.isValid === false && validation.message}
                <br />
                {validation.isValid !== false && description}
            </React.Fragment>
        );
    }
}

export default CheckboxGroup;
