import React from 'react';
import {Webiny} from 'webiny-client';
import DashboardView from './Dashboard';

class Dashboard extends Webiny.App.Module {
    init() {
        this.name = 'Dashboard';

        this.registerMenus(
            // Create a Menu with title "Dashboard", which points to route "Dashboard"
            // and has an icon "fa-home"
            <Webiny.Ui.Menu label="Dashboard" route="Dashboard" icon="fa-home"/>
        );

        this.registerRoutes(
            // Create a Route called "Dashboard", which matches the root of our app
            // and renders DashboardView component with document title of "Dashboard"
            new Webiny.Route('Dashboard', '/', DashboardView, 'Dashboard')
        );
    }
}

export default Dashboard;