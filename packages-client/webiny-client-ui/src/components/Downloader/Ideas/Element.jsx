import React from 'react';
import {Webiny} from 'webiny-client';

class Element extends Webiny.Ui.Component {
    
}

Element.defaultProps = {
    renderer() {
        return (
            <webiny-download-element>
                {this.props.children({download: this.props.download})}
            </webiny-download-element>
        );
    }
};

export default Element;