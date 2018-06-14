
import React from "react";
import { Component } from 'webiny-client';

@Component()
class Row extends React.Component {
    render() {
        return this.props.children;
    }
}

export default Row;