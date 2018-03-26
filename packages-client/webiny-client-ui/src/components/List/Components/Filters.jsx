import React from 'react';
import { createComponent } from 'webiny-client';

class Filters extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const callbacks = {
            apply: filters => () => this.props.onFilter(filters),
            reset: () => () => this.props.onFilter({})
        };

        return (
            <webiny-list-filters>{this.props.children.call(this, callbacks)}</webiny-list-filters>
        );
    }
}

export default createComponent(Filters);