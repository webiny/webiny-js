import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Skeleton.Auth.Forbidden
 */
class Forbidden extends Webiny.Ui.View {

}

Forbidden.defaultProps = {
    renderer() {
        const {Icon, View} = this.props;
        return (
            <View.List>
                <View.Body>
                    <h3><Icon icon="icon-cancel"/>{this.i18n('Access Forbidden')}</h3>

                    <p>
                        {this.i18n('Unfortunately, you are not allowed to see this page.')}<br/>
                        {this.i18n('If you think this is a mistake, please contact your system administrator.')}
                    </p>
                </View.Body>
            </View.List>
        );
    }
};

export default Webiny.createComponent(Forbidden, {modules: ['Icon', 'View']});