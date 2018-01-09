import React from 'react';
import {Webiny} from 'webiny-client';

class EmptyLayout extends Webiny.Ui.View {

}

EmptyLayout.defaultProps = {
    renderer() {
        return (
            <div className="master minimized">
                <div className="master-content">
                    <div className="container-fluid">
                        <Webiny.Ui.Placeholder name="Content"/>
                    </div>
                </div>
            </div>
        );
    }
};

export default EmptyLayout;
