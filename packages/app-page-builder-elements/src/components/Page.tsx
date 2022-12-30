import React from "react";
import { Page as PageType } from "~/types";
import { Content } from "./Content";
import { PageProvider } from "~/contexts/Page";

export interface PageProps {
    page: PageType;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
}

export const Page: React.FC<PageProps> = props => {
    const { page } = props;

    let content = <Content content={page.content} />;

    const Layout = props.layout;
    if (Layout) {
        content = <Layout>{content}</Layout>;
    }

    return (
        <PageProvider page={page} key={page.id}>
            {content}
        </PageProvider>
    );
};
