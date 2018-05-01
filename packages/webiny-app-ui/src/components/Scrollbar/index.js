import React from "react";
import { createComponent } from "webiny-app";

/**
 * Wrapper around React Custom Scrollbars (https://github.com/malte-wessel/react-custom-scrollbars).
 */
class Scrollbar extends React.Component {
    render() {
        const { modules: { ReactCustomScrollbars }, ...props } = this.props;
        return <ReactCustomScrollbars {...props} />;
    }
}

export default createComponent(Scrollbar, {
    modules: [{ ReactCustomScrollbars: "Vendor.ReactCustomScrollbars" }]
});
