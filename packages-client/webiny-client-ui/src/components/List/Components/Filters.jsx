import React from 'react';
import {Webiny} from 'webiny-client';

class Filters extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('applyFilters');
    }

    applyFilters(filters) {
        this.props.onFilter(filters);
    }
}

Filters.defaultProps = {
    renderer() {
        const callbacks = {
            apply: filters => () => this.applyFilters(filters),
            reset: () => () => this.applyFilters({})
        };

        return (
            <webiny-list-filters>{this.props.children.call(this, callbacks)}</webiny-list-filters>
        );
    }
};

export default Filters;