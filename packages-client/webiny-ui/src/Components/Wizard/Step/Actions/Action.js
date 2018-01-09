import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

class Action extends Webiny.Ui.Component {
}

// Receives all standard Button component props
Action.defaultProps = {
    wizard: null,
    renderer() {
        const {Button} = this.props;
        return <Button {..._.omit(this.props, ['Button', 'renderer'])}/>;
    }
};

export default Webiny.createComponent(Action, {modules: ['Button']});