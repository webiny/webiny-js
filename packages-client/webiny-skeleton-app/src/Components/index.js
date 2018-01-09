import {Webiny} from 'webiny-client';

export default () => {
    Webiny.registerModule(
        new Webiny.Module('Webiny/Skeleton/Header', () => import('./Header')),
        new Webiny.Module('Webiny/Skeleton/Logo', () => import('./Logo')),
        new Webiny.Module('Webiny/Skeleton/Navigation', () => import('./Navigation')),
        new Webiny.Module('Webiny/Skeleton/Navigation/Desktop', () => import('./Navigation/Desktop')),
        new Webiny.Module('Webiny/Skeleton/Navigation/Mobile', () => import('./Navigation/Mobile')),
        new Webiny.Module('Webiny/Skeleton/UserMenu', () => import('./UserMenu')),
        new Webiny.Module('Webiny/Skeleton/UserMenu/AccountPreferences', () => import('./UserMenu/AccountPreferences')).setTags('user-menu-item'),
        new Webiny.Module('Webiny/Skeleton/UserMenu/Logout', () => import('./UserMenu/Logout')).setTags('user-logout-menu-item'),
        new Webiny.Module('Webiny/Skeleton/Notifications/Widget', () => import('./Notifications/Widget')),
        new Webiny.Module('Webiny/Skeleton/Notifications/Container', () => import('./Notifications/Container')),
        new Webiny.Module('Webiny/Skeleton/Notifications/Notification', () => import('./Notifications/Notification')),
    );
};