import _ from 'lodash';
import React from 'react';
import Component from './../Core/Component';
import Router from './../Router/Router';
import Dispatcher from './../Core/Dispatcher';
import Placeholder from './Placeholder';

/**
 * This component serves as the main entry component which binds to Router.
 * It re-renders itself when 'RenderView' event is triggered by the Router to render the new Placeholders content.
 */
class RootElement extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ts: _.now()
        };
    }

    componentDidMount() {
        console.timeStamp('RootElement DidMount');
        this.unsubscribe = Dispatcher.on('RenderView', () => {
            return this.setState({ts: _.now()});
        });

        Router.start();
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.unsubscribe();
    }
}

RootElement.defaultProps = {
    onDidUpdate: _.noop,
    renderer() {
        return React.createElement('div', null, React.createElement(Placeholder, {
            name: 'Layout',
            onDidUpdate: this.props.onDidUpdate
        }));
    }
};

export default RootElement;
