import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { Plugins } from "@webiny/app-admin";
import { CompanyEntryList } from "./CompanyEntryList";
import { EmployeeEntryList } from "./EmployeeEntryList";
import { DecorateContentEntryFormHook } from "./ContentEntryForm/DecorateContentEntryFormHook";
import { DecorateContentEntryFormBind } from "./ContentEntryForm/DecorateContentEntryFormBind";
import { DecorateContentEntryForm } from "./ContentEntryForm/DecorateContentEntryForm";
import { DecorateContentEntryFormPreview } from "./ContentEntryForm/DecorateContentEntryFormPreview";
import { HideMenuItems } from "./HideMenuItems";
import { SmartSeo } from "./ContentEntryForm/SmartSeo";
import { Layout } from "./Layout";
import { ArticleEntryList } from "./ArticleEntryList";
import { ArticleEntryForm } from "./ArticleEntryForm";
import { LivePreview } from "./LivePreview";

export const AdminPlugins = () => {
    return (
        <>
            <Plugins>
                <HideMenuItems />
            </Plugins>
            <Layout />
            <CompanyEntryList />
            <EmployeeEntryList />
            <ArticleEntryList />
            <DecorateContentEntryForm />
            <DecorateContentEntryFormPreview />
            <ContentEntryEditorConfig>
                <SmartSeo />
                <DecorateContentEntryFormHook />
                <DecorateContentEntryFormBind />
            </ContentEntryEditorConfig>
            <ArticleEntryForm />
            <LivePreview />
        </>
    );
};
