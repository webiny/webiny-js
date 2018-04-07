
import React from "react";
import { createComponent } from 'webiny-app';

class Row extends React.Component {
    render() {
        return this.props.children;
    }
}

export default createComponent(Row);