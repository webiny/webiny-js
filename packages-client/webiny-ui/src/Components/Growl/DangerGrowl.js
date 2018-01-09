import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Growl from './Growl';

class DangerGrowl extends Webiny.Ui.Component {

}

DangerGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: true,
    message: null,
    type: 'danger',
    renderer() {
        return (
            <Growl {..._.omit(this.props, ['renderer'])}/>
        );
    }
};

export default Webiny.createComponent(DangerGrowl);