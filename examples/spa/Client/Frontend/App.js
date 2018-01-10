import React from 'react';
import {Webiny} from 'webiny-client';
import Skeleton from 'webiny-skeleton-app';
import Dashboard from './Modules/Dashboard';
import logo from './../Assets/images/logo.png';

class MyAppFrontend extends Webiny.App {
    constructor() {
        super();

        this.name = 'MyApp.Frontend';
        this.dependencies = [
            new Skeleton.App()
        ];

        this.modules = [
            new Dashboard(this)
        ];

        Webiny.configureModule('Webiny/Layout/Logo', (Logo) => {
            Logo.configure({
                defaultProps: {
                    img: logo
                }
            });
        });

        Webiny.Router.setBaseUrl('/');
        Webiny.Router.setTitlePattern('%s | MyApp');
        Webiny.Router.setDefaultRoute('Dashboard');
    }
}

export default MyAppFrontend;