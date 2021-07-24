import React from "react";
import { View } from "@webiny/ui-composer/View";
import { AdminView } from "@webiny/app-admin/views/AdminView";
import { SplitView } from "@webiny/app-admin/views/SplitView";
import { ViewElement } from "@webiny/ui-elements/ViewElement";
import { ButtonElement } from "@webiny/ui-elements/ButtonElement";
import { AdminViewPlugin } from "@webiny/app-admin/plugins/AdminViewPlugin";
import { UsersFormView } from "~/views/Users/UsersFormView";
import { useUserForm } from "~/views/Users/hooks/useUserForm";

export class UsersView extends View {
    constructor() {
        super("admin-users-view");
        this.addElements();
    }

    private addElements() {
        const adminLayout = new AdminView();
        adminLayout.setTitle("Security - Users");

        const splitView = new SplitView("admin-users-split-view", {
            rightPanel: new ViewElement("admin-users-form", {
                view: new UsersFormView(),
                hook: useUserForm
            })
        });

        adminLayout.setContentElement(new ViewElement("split-view", { view: splitView }));

        this.addElement(adminLayout);

        // Experimental
        this.getElement("headerRight").addElement(
            new ButtonElement("left-form", {
                label: "Show on the left",
                type: "primary",
                onClick: ({ render }) => {
                    splitView.getRightPanel().moveBefore(splitView.getLeftPanel());
                    render();
                }
            })
        );

        this.getElement("headerRight").addElement(
            new ButtonElement("right-form", {
                label: "Show on the right",
                type: "primary",
                onClick: ({ render }) => {
                    splitView.getRightPanel().moveAfter(splitView.getLeftPanel());
                    render();
                }
            })
        );
    }
}
