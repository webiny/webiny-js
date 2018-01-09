import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Growl from './Growl';

class SuccessGrowl extends Webiny.Ui.Component {

}

SuccessGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    type: 'success',
    renderer() {
        return (
            <Growl {..._.omit(this.props, ['renderer'])}/>
        );
    }
};

export default Webiny.createComponent(SuccessGrowl);