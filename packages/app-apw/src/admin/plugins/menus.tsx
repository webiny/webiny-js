import { NavigationMenuElement } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

export default [
    new UIViewPlugin<NavigationView>(NavigationView, async view => {
        await view.isRendered();

        const { identity } = view.getSecurityHook();
        if (!identity.getPermission("apw")) {
            return;
        }

        const localesMenu = view.addSettingsMenuElement(
            new NavigationMenuElement("apw", {
                label: "APW"
            })
        );

        localesMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("apw.publishingWorkflows", {
                label: "Publishing workflows",
                path: "/apw/publishing-workflows"
            })
        );
    })
];
