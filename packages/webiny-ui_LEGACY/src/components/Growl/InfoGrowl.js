import React from "react";
import _ from "lodash";
import { inject } from "webiny-app";
import Growl from "./Growl";

@inject()
class InfoGrowl extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <Growl {..._.omit(this.props, ["render"])} />;
    }
}

InfoGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null
};

export default InfoGrowl;
