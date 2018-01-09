import React from 'react';
import {Webiny} from 'webiny-client';

class Date extends Webiny.Ui.Component {
}

Date.defaultProps = {
    format: null,
    default: '-',
    value: null,
    renderer() {
        try {
            return <span>{Webiny.I18n.date(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
};


export default Webiny.createComponent(Date);