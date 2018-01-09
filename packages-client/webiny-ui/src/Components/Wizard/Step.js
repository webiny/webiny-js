import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

import Content from './Step/Content';
import Actions from './Step/Actions';

class Step extends Webiny.Ui.Component {
}

Step.defaultProps = {
    current: false,
    completed: false,
    title: null,
    name: null,
    onLeave: _.noop,
    onEnter: _.noop
};

Step.Content = Content;
Step.Actions = Actions;

export default Step;