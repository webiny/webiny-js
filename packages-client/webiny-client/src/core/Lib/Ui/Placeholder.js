import _ from 'lodash';
import React from 'react';
import ViewManager from './../Core/ViewManager';
import Component from './../Core/Component';

class Placeholder extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        if (this.props.componentDidMount) {
            this.props.componentDidMount();
        }
    }

    componentDidUpdate() {
        if (this.props.onDidUpdate) {
            this.props.onDidUpdate();
        }
    }
}

Placeholder.defaultProps = {
    renderer() {
        let item = ViewManager.getContent(this.props.name);
        const componentProps = _.omit(this.props, ['renderer', 'name', 'children']);
        if (!item) {
            return <webiny-placeholder>{this.props.children}</webiny-placeholder>;
        }
        let component = null;
        if (React.isValidElement(item)) {
            component = _.isString(item.type) ? item : React.cloneElement(item, componentProps);
        } else {
            if (!_.isFunction(item)) {
                _.assign(componentProps, item[1]);
                item = item[0];
            }
            component = React.createElement(item, componentProps);
        }

        return React.createElement('webiny-placeholder', null, component);
    }
};

export default Placeholder;