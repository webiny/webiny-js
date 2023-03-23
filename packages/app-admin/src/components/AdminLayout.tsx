import React from "react";
import { Layout } from "~/index";

interface AdminLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const AdminLayout: React.VFC<AdminLayoutProps> = ({ title, children }) => {
    return <Layout title={title}>{children}</Layout>;
};
