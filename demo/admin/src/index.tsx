import React from "react";
import { plugins } from "@webiny/plugins";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { Plugins } from "@webiny/app-admin";
import { CompanyEntryList } from "./CompanyEntryList";
import { EmployeeEntryList } from "./EmployeeEntryList";
import { hiddenFieldRenderer } from "./fieldRenderers/hiddenFieldRenderer";
import { DecorateContentEntryFormHook } from "./ContentEntryForm/DecorateContentEntryFormHook";
import { DecorateContentEntryFormBind } from "./ContentEntryForm/DecorateContentEntryFormBind";
import { DecorateContentEntryForm } from "./ContentEntryForm/DecorateContentEntryForm";
import { DecorateContentEntryFormPreview } from "./ContentEntryForm/DecorateContentEntryFormPreview";
import { HideMenuItems } from "./HideMenuItems";
import { SmartSeo } from "./ContentEntryForm/SmartSeo";
import { Layout } from "./Layout";
import { ArticleEntryList } from "./ArticleEntryList";

const RegisterFieldRenderers = () => {
    plugins.register(hiddenFieldRenderer);
    return null;
};

export const AdminPlugins = () => {
    return (
        <>
            <Plugins>
                <RegisterFieldRenderers />
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
        </>
    );
};
