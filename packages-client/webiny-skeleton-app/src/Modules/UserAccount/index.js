import {Webiny} from 'webiny-client';

class Module extends Webiny.App.Module {

    init() {
        this.name = 'UserAccount';

        this.registerRoutes(
            new Webiny.Route('Me.Notifications', '/me/notifications', () => Webiny.import('Webiny/Skeleton/UserNotificationsList'), 'My Notifications'),
            new Webiny.Route('Me.Account', '/me/account', () => Webiny.import('Webiny/Skeleton/UserAccountForm'), 'My Account')
        );

        Webiny.registerModule(
            new Webiny.Module('Webiny/Skeleton/UserAccountForm', () => import('./UserAccountForm')),
            new Webiny.Module('Webiny/Skeleton/UserNotificationsList', () => import('./UserNotificationsList'))
        );
    }
}

export default Module;