import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-client";

class Switch extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { children, value } = this.props;

        if (!_.isArray(children) || children.length === 1) {
            throw Error("Switch component must have at least two cases to check.");
        }

        let defaultRender = null;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.type === "case") {
                const childValue = _.isFunction(child.props.value)
                    ? child.props.value()
                    : child.props.value;
                if (value !== "__empty__") {
                    if (childValue === value) {
                        return child;
                    }
                    continue;
                }

                if (value) {
                    return child;
                }
            }

            if (child.type === "default") {
                defaultRender = child;
            }
        }

        return defaultRender;
    }
}

Switch.defaultProps = {
    value: "__empty__"
};

export default createComponent(Switch);
