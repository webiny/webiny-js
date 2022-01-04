import install from "./install";
import permissionRenderer from "./permissionRenderer";
import apolloLink from "./apolloLink";
import localeTypes from "./localeTypes";

export default () => [permissionRenderer, install, apolloLink, localeTypes];
