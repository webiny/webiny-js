import routes from "./routes";
import menus from "./menus";
import install from "./install";
import permissionRenderer from "./permissionRenderer";
import apolloLink from "./apolloLink";
import localeTypes from "./localeTypes";

export default () => [
    routes,
    menus,
    permissionRenderer,
    install,
    apolloLink,
    localeTypes
];
