import React from "react";
import { Layout } from "~/index";

interface AdminLayoutProps {
    title?: string;
    children?: React.ReactNode;
}

export const AdminLayout = ({ title, children }: AdminLayoutProps) => {
    return <Layout title={title}>{children}</Layout>;
};
