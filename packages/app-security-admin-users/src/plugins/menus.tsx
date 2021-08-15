import { NavigationMenuElement, TAGS } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { Permission } from "./constants";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

export default new UIViewPlugin<NavigationView>(NavigationView, async view => {
    await view.isRendered();

    const { identity } = view.getSecurityHook();
    const groups = identity.getPermission(Permission.Groups);
    const users = identity.getPermission(Permission.Users);
    const apiKeys = identity.getPermission(Permission.ApiKeys);

    if (!groups && !users && !apiKeys) {
        return;
    }

    const mainMenu = view.getSettingsMenuElement().addElement<NavigationMenuElement>(
        new NavigationMenuElement("security", {
            label: "Security",
            tags: [TAGS.UTILS]
        })
    );

    if (users) {
        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("users", {
                label: "Users",
                path: "/security/users"
            })
        );
    }

    if (groups) {
        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("groups", {
                label: "Groups",
                path: "/security/groups"
            })
        );
    }

    if (apiKeys) {
        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("apiKeys", {
                label: "API Keys",
                path: "/security/api-keys"
            })
        );
    }
});
