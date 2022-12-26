import React from "react";
import { Page as PageType } from "~/types";
import { Content } from "./Content";
import { PageProvider } from "~/contexts/Page";

export interface PageProps {
    page: PageType;
}

export const Page: React.ComponentType<PageProps> = props => {
    const { page } = props;

    return (
        <PageProvider page={page}>
            <Content content={page.content} />
        </PageProvider>
    );
};
