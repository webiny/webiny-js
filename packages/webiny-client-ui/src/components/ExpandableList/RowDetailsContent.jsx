import React from 'react';
import { createComponent } from 'webiny-client';

class RowDetailsContent extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let content = this.props.children;
        if (typeof this.props.children === "function") {
            content = this.props.children.call(this);
        }

        return <div>{content}</div>;
    }
}

export default createComponent(RowDetailsContent);