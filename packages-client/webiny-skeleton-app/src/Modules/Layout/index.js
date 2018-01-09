import React from 'react';
import {Webiny} from 'webiny-client';
import Header from './Components/Header';
import DefaultLayout from './Layout';
import EmptyLayout from './EmptyLayout';
import Dashboard from './Views/Dashboard';

class Layout extends Webiny.App.Module {

    init() {
        this.name = 'Layout';
        this.registerDefaultLayout(DefaultLayout);
        this.registerLayout('empty', EmptyLayout);
        this.registerDefaultComponents({Header});

        this.registerRoutes(
            new Webiny.Route('Dashboard', '/', Dashboard, 'Dashboard')
        );
    }
}

export default Layout;