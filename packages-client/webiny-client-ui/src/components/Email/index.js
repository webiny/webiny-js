import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-client";

class Email extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const props = _.omit(this.props, ["render", "Input"]);
        if (props.onChange) {
            props.onChange = (value, cb) => {
                return this.props.onChange(value ? value.toLowerCase().trim() : value, cb);
            };
        }

        const { Input } = this.props;
        return <Input {...props} />;
    }
}

Email.defaultProps = {
    defaultValidators: "email"
};

export default createComponent(Email, { modules: ["Input"] });
