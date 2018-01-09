import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Skeleton.Layout.Dashboard
 */
class Dashboard extends Webiny.Ui.Component {

}

Dashboard.defaultProps = {
    renderer() {
        return (
            <Webiny.Ui.LazyLoad modules={['View']}>
                {(Ui) => (
                    <Ui.View.Dashboard>
                        <Ui.View.Header
                            title={this.i18n('Welcome to Webiny!')}
                            description={this.i18n('This is a demo dashboard! From here you can start developing your almighty app.')}/>
                    </Ui.View.Dashboard>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default Dashboard;