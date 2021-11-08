import { NavigationMenuElement, TAGS } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { Permission } from "./constants";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

export default new UIViewPlugin<NavigationView>(NavigationView, async view => {
    await view.isRendered();

    const { identity } = view.getSecurityHook();
    const users = identity.getPermission(Permission.Users);

    if (!users) {
        return;
    }

    if (users) {
        const mainMenu = view.getSettingsMenuElement().addElement<NavigationMenuElement>(
            new NavigationMenuElement("adminUsers", {
                label: "Admin Users",
                tags: [TAGS.UTILS]
            })
        );

        mainMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("users", {
                label: "Users",
                path: "/admin-users"
            })
        );
    }
});
