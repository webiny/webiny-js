import React, { useEffect, useState } from "react";
import { UIViewComponent } from "~/ui/UIView";
import { GenericElement } from "~/ui/elements/GenericElement";
import { AdminView } from "~/ui/views/AdminView";

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

    return <UIViewComponent view={view} />;
};
