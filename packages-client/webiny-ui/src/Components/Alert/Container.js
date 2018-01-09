import React from 'react';
import {Webiny} from 'webiny-client';

class AlertContainer extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            closed: false
        };
    }

    close() {
        Promise.resolve(this.props.onClose()).then(() => {
            if (this.isMounted()) {
                this.setState({closed: true});
            }
        });
    }

    render() {
        if (this.state.closed) {
            return null;
        }

        return this.props.children(this.close.bind(this));
    }
}

export default AlertContainer;