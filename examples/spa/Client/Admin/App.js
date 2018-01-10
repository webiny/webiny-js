import React from 'react';
import {Webiny} from 'webiny-client';
import Backend from 'webiny-backend-app';
import Dashboard from './Modules/Dashboard';

class Admin extends Webiny.App {
    constructor() {
        super();
        this.name = 'MyApp.Frontend';

        this.dependencies = [
            new Backend.App()
        ];

        this.modules = [
            new Dashboard(this)
        ];

        Webiny.Router.setTitlePattern('%s | MyApp');
        Webiny.Router.setDefaultRoute('Dashboard');
    }
}

export default Admin;