import React from "react";
import { Component } from "webiny-client";

/**
 * Wrapper around React Custom Scrollbars (https://github.com/malte-wessel/react-custom-scrollbars).
 */
@Component({
    modules: [{ ReactCustomScrollbars: "Vendor.ReactCustomScrollbars" }]
})
class Scrollbar extends React.Component {
    render() {
        const {
            modules: { ReactCustomScrollbars },
            ...props
        } = this.props;
        return <ReactCustomScrollbars {...props} />;
    }
}

export default Scrollbar;
