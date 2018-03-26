import {Webiny} from 'webiny-client';
import React from 'react';
import Dashboard from './Views/Dashboard';

/**
 * @i18n.namespace Webiny.Backend.Dashboard
 */
class Module extends Webiny.App.Module {

    init() {
        this.name = 'Dashboard';
        const role = 'webiny-dashboard';

        this.registerMenus(
            <Webiny.Ui.Menu order="0" label={Webiny.I18n('Dashboard')} route="Dashboard" icon="fa-home" role={role}/>
        );

        this.registerRoutes(
            new Webiny.Route('Dashboard', '/dashboard', Dashboard, 'Dashboard').setRole(role)
        );
    }
}

export default Module;