// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import type Radio from "./Radio";

type Props = FormComponentProps & {
    // Form element's label.
    label?: string,

    // Form element's description.
    description?: string,

    // An array of Radio components.
    children: ({
        onChange: (id: string | number) => () => void
    }) => React.ChildrenArray<React.Element<Radio>>
};

class RadioGroup extends React.Component<Props> {
    render() {
        const { description, validation = { isValid: null } } = this.props;

        return (
            <React.Fragment>
                {this.props.label}
                <br />
                {this.props.children({
                    onChange: id => {
                        return () => this.props.onChange(id);
                    },
                    getValue: id => this.props.value === id
                })}
                {validation.isValid === false && validation.message}
                <br />
                {validation.isValid !== false && description}
            </React.Fragment>
        );
    }
}

export default RadioGroup;
