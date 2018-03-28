import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import Growl from "./Growl";

class WarningGrowl extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <Growl {..._.omit(this.props, ["render"])} />;
    }
}

WarningGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    type: "warning"
};

export default createComponent(WarningGrowl);
