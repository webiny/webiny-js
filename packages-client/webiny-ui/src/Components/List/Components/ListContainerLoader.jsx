import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ListContainerLoader extends Webiny.Ui.Component {

}

ListContainerLoader.defaultProps = {
    renderer() {
        if (!this.props.show) {
            return null;
        }

        if (_.isFunction(this.props.children)) {
            return this.props.children();
        }

        const {Loader} = this.props;
        return <Loader/>;
    }
};

export default Webiny.createComponent(ListContainerLoader, {modules: ['Loader']});