import React from 'react';
import {Webiny} from 'webiny-client';

class ErrorCount extends Webiny.Ui.View {

    constructor(props) {
        super(props);

        this.state = {
            errorCount: this.props.count
        };

        this.bindMethods('updateCount');
    }

    updateCount(count) {
        this.setState({errorCount: count});
    }

}

ErrorCount.defaultProps = {
    renderer() {
        return <span className="badge badge-primary">{this.state.errorCount}</span>;
    }
};

export default ErrorCount;