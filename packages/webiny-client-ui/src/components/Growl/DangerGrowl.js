import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import Growl from "./Growl";

@inject()
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

export default DangerGrowl;
