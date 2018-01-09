import React from 'react';
import {Webiny} from 'webiny-client';
import LoginRegister from './Views/LoginRegister';
import Browse from './Views/Browse';
import AppDetails from './Views/AppDetails';

/**
 * @i18n.namespace Webiny.Backend.Marketplace
 */
class Project extends Webiny.App.Module {

    init() {
        this.name = 'Marketplace';

        this.registerMenus(
            <Webiny.Ui.Menu label={Webiny.I18n('Marketplace')} icon="icon-basket_n" route="Marketplace.Browse"/>
        );

        this.registerRoutes(
            new Webiny.Route('Marketplace.LoginRegister', '/marketplace/login-register', LoginRegister, 'Marketplace'),
            new Webiny.Route('Marketplace.AppDetails', '/marketplace/:id', {
                Content: <Browse appDetails/>,
                Apps: AppDetails
            }, 'Marketplace'),
            new Webiny.Route('Marketplace.Browse', '/marketplace', Browse, 'Marketplace'),
        );
    }
}

export default Project;