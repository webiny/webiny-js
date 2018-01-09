import React from 'react';
import {Webiny} from 'webiny-client';

class Row extends Webiny.Ui.Component {
    // This component doesn't do much :)
}


Row.defaultProps = {
    style: null,
    renderer() {
        return <div style={this.props.style} className={this.classSet('row', this.props.className)}>{this.props.children}</div>;
    }
};

export default Row;