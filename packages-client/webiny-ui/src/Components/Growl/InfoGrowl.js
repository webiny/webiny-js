import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Growl from './Growl';

class InfoGrowl extends Webiny.Ui.Component {

}

InfoGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    renderer() {
        return (
            <Growl {..._.omit(this.props, ['renderer'])}/>
        );
    }
};

export default Webiny.createComponent(InfoGrowl);