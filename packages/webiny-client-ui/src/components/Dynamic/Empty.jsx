import React from 'react';
import { Component } from 'webiny-client';

@Component()
class Empty extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <webiny-dynamic-fieldset-empty>{this.props.children}</webiny-dynamic-fieldset-empty>;
    }
}

export default Empty;