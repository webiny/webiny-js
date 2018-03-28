import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import Growl from "./Growl";

class DangerGrowl extends React.Component {
    render() {
        return <Growl {..._.omit(this.props, ["render"])} />;
    }
}

DangerGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: true,
    message: null,
    type: "danger"
};

export default createComponent(DangerGrowl);
