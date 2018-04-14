import React from "react";
import { createComponent } from "webiny-app";

/**
 * Wrapper around React Custom Scrollbars (https://github.com/malte-wessel/react-custom-scrollbars).
 */
class Scrollbar extends React.Component {
    render() {
        const Scrollbars = this.props.modules.ReactCustomScrollbars;
        return <Scrollbars {...this.props} />;
    }
}

export default createComponent(Scrollbar, {
    modules: ["Icon", { ReactCustomScrollbars: "Vendor.ReactCustomScrollbars" }]
});
