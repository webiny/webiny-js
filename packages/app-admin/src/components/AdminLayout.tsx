import React from "react";
import { Layout } from "~/index";

interface AdminLayoutProps {
    title?: string;
}

export const AdminLayout: React.FC<React.PropsWithChildren<AdminLayoutProps>> = ({
    title,
    children
}) => {
    return <Layout title={title}>{children}</Layout>;
};
