import React from 'react';
import {Webiny} from 'webiny-client';
import ListErrors from './ListErrors';

/**
 * @i18n.namespace Webiny.Backend.Logger.Main
 */
class Main extends Webiny.Ui.View {

}

Main.defaultProps = {
    renderer() {
        return (
            <Webiny.Ui.LazyLoad modules={['View', 'Tabs']}>
                {(Ui) => (
                    <Ui.View.List>
                        <Ui.View.Header title={this.i18n('Logger')}/>

                        <Ui.View.Body noPadding={true}>

                            <Ui.Tabs size="large">
                                <Ui.Tabs.Tab label={this.i18n('JavaScript')} icon="fa-code">
                                    <ListErrors type="js"/>
                                </Ui.Tabs.Tab>

                                <Ui.Tabs.Tab label={this.i18n('PHP')} icon="fa-file-code-o">
                                    <ListErrors type="php"/>
                                </Ui.Tabs.Tab>

                                <Ui.Tabs.Tab label={this.i18n('Api')} icon="fa-rocket">
                                    <ListErrors type="api"/>
                                </Ui.Tabs.Tab>
                            </Ui.Tabs>

                        </Ui.View.Body>
                    </Ui.View.List>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default Main;