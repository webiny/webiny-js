import React from 'react';
import {Webiny} from 'webiny-client';
import Backend from 'webiny-backend-app';
import Dashboard from './Modules/Dashboard';

class MyAppFrontend extends Webiny.App {
    constructor() {
        super();

        this.name = 'MyApp.UserArea';

        this.dependencies = [
            new Backend.App()
        ];

        this.modules = [
            new Dashboard(this)
        ];

        Webiny.Router.setBaseUrl('/userarea');
    }
}

export default MyAppFrontend;