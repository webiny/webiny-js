import {Webiny} from 'webiny-client';

Webiny.registerModule(
    new Webiny.Module('Webiny/Backend/UserRoles', () => import('./UserRoles')),
    new Webiny.Module('Webiny/Backend/UserRoleGroups', () => import('./UserRoleGroups')),
    new Webiny.Module('Webiny/Backend/UserPermissions', () => import('./UserPermissions'))
);