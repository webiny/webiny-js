import React from "react";
import { createComponent } from "webiny-client";

class Email extends React.Component {
    render() {
        const { render, Input, ...props } = this.props;
        if (render) {
            return render.call(this);
        }

        if (props.onChange) {
            props.onChange = (value, cb) => {
                return this.props.onChange(value ? value.toLowerCase().trim() : value, cb);
            };
        }

        return <Input {...props} />;
    }
}

Email.defaultProps = {
    defaultValidators: "email"
};

export default createComponent(Email, { modules: ["Input"], formComponent: true });
