import React from 'react';
import {Webiny} from 'webiny-client';

class DateTime extends Webiny.Ui.Component {
}

DateTime.defaultProps = {
    format: null,
    default: '-',
    value: null,
    renderer() {
        try {
            return <span>{Webiny.I18n.datetime(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
};


export default Webiny.createComponent(DateTime);