import React from 'react';

class AlertContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            closed: false
        };

        this.mounted = false;
    }

    close() {
        Promise.resolve(this.props.onClose()).then(() => {
            if (this.mounted) {
                this.setState({ closed: true });
            }
        });
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        if (this.state.closed) {
            return null;
        }

        return this.props.children(this.close.bind(this));
    }
}

export default AlertContainer;