import React from 'react';
import {Webiny} from 'webiny-client';

class Number extends Webiny.Ui.Component {
}

Number.defaultProps = {
    format: null,
    default: '-',
    value: null,
    renderer() {
        try {
            return <span>{Webiny.I18n.price(this.props.value, this.props.format)}</span>;
        } catch (e) {
            return this.props.default;
        }
    }
};


export default Webiny.createComponent(Number);