import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class CaseField extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let content = null;
        let defaultContent = null;
        _.each(React.Children.toArray(this.props.children), child => {
            if (child.type === "default") {
                defaultContent = child.props.children;
                return;
            }
            const value = child.props.value;
            if (
                (_.isFunction(value) && value(this.props.data) === true) ||
                value === _.get(this.props.data, this.props.name)
            ) {
                content = child.props.children;
            }
        });

        if (!content) {
            content = defaultContent;
        }

        if (_.isFunction(content)) {
            content = content.call(this, { data: this.props.data });
        }

        const { modules: { List }, ...props } = this.props;

        return <List.Table.Field {..._.omit(props, ["render"])}>{content}</List.Table.Field>;
    }
}

export default createComponent(CaseField, { modules: ["List"], tableField: true });
