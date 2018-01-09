import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * Layout is the main container that will hold all other components.
 * This component is the first one to render in the <body> element.
 */
class Layout extends Webiny.Ui.View {

}

Layout.defaultProps = {
    renderer() {
        const {Navigation} = this.props;

        return (
            <div className="master minimized">
                <Webiny.Ui.Placeholder name="Header"/>
                <Navigation/>
                <div className="master-content">
                    <div className="container-fluid">
                        <Webiny.Ui.Placeholder name="Content"/>
                    </div>
                </div>
                <Webiny.Ui.Placeholder name="Footer"/>
            </div>
        );
    }
};

export default Webiny.createComponent(Layout, {
    modules: [{
        Navigation: 'Webiny/Skeleton/Navigation'
    }]
});
