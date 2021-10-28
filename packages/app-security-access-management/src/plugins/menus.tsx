import { NavigationMenuElement, TAGS } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { Permission } from "./constants";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

export default new UIViewPlugin<NavigationView>(NavigationView, async view => {
    await view.isRendered();

    const { identity } = view.getSecurityHook();
    const groups = identity.getPermission(Permission.Groups);
    const apiKeys = identity.getPermission(Permission.ApiKeys);

    if (!groups && !apiKeys) {
        return;
    }

    const mainMenu = view.getSettingsMenuElement().addElement<NavigationMenuElement>(
        new NavigationMenuElement("accessManagement", {
            label: "Access Management",
            tags: [TAGS.UTILS]
        })
    );

    if (groups) {
        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("groups", {
                label: "Groups",
                path: "/access-management/groups"
            })
        );
    }

    if (apiKeys) {
        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("apiKeys", {
                label: "API Keys",
                path: "/access-management/api-keys"
            })
        );
    }
});
