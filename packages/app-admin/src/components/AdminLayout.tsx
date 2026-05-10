import React from "react";
import { Layout } from "~/base/ui/Layout.js";

interface AdminLayoutProps {
    title?: string;
    children?: React.ReactNode;
}

export const AdminLayout = ({ title, children }: AdminLayoutProps) => {
    return <Layout title={title}>{children}</Layout>;
};
