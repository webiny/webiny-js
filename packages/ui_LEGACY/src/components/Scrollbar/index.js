import React from "react";
import { inject } from "webiny-app";

/**
 * Wrapper around React Custom Scrollbars (https://github.com/malte-wessel/react-custom-scrollbars).
 */
@inject({
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
