import React from "react";
import _ from "lodash";
import css from "./Field.css";
import classNames from "classnames";

import { createComponent } from "webiny-app";

class Field extends React.Component {
    render() {
        const field = this.props.data;
        return (
            <div
                className={classNames(css.field, { [css.enabled]: this.props.enabled })}
                onClick={() => this.props.onToggleField(field.name)}
            >
                <div>
                    <strong>{field.name}</strong>
                </div>
                <div>{field.description}</div>
            </div>
        );
    }
}

Field.defaultProps = {
    enabled: false,
    data: null,
    onToggleField: _.noop
};

export default createComponent(Field, {});
