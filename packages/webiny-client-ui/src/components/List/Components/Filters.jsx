import React from "react";
import { createComponent } from "webiny-client";

class Filters extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const callbacks = {
            apply: filter => () => this.props.onFilter(filter),
            reset: () => () => this.props.onFilter({})
        };

        return (
            <webiny-list-filter>{this.props.children.call(this, callbacks)}</webiny-list-filter>
        );
    }
}

export default createComponent(Filters, { listFiltersComponent: true });
