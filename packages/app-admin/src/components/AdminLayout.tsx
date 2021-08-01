import React, { useEffect, useState } from "react";
import { ViewComponent } from "@webiny/ui-composer/View";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { AdminView } from "~/views/AdminView";

interface AdminLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const AdminLayout = ({ title, children }: AdminLayoutProps) => {
    const [view, setView] = useState(null);
    useEffect(() => {
        const view = new AdminView();

        if (title) {
            view.setTitle(title);
        }

        view.setContentElement(new GenericElement("admin-layout-content", () => children));

        setView(view);
    }, []);

    if (!view) {
        return null;
    }

    return <ViewComponent view={view} />;
};
