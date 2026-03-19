import React from "react";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SeoIcon } from "@webiny/icons/search.svg";
import { ReactComponent as SocialIcon } from "@webiny/icons/thumb_up.svg";
import { ReactComponent as SchemaIcon } from "@webiny/icons/schema.svg";
import { InternalPageEditorConfig } from "~/modules/pages/PageEditor/PageEditorConfig.js";
import { GeneralTitle } from "./elements/GeneralTitle.js";
import { GeneralPath } from "./elements/GeneralPath.js";
import { GeneralSnippet } from "./elements/GeneralSnippet.js";
import { GeneralImage } from "./elements/GeneralImage.js";
import { GeneralTags } from "./elements/GeneralTags.js";
import { SeoTitle } from "./elements/SeoTitle.js";
import { SeoDescription } from "./elements/SeoDescription.js";
import { SeoMetaTags } from "./elements/SeoMetaTags.js";
import { SeoCanonicalUrl } from "./elements/SeoCanonicalUrl.js";
import { SeoNoIndex } from "./elements/SeoNoIndex.js";
import { SeoNoFollow } from "./elements/SeoNoFollow.js";
import { SocialTitle } from "./elements/SocialTitle.js";
import { SocialDescription } from "./elements/SocialDescription.js";
import { SocialImage } from "./elements/SocialImage.js";
import { SocialMetaTags } from "./elements/SocialMetaTags.js";
import { SchemaEditor } from "./elements/SchemaEditor.js";

const { PageSettings } = InternalPageEditorConfig;

export const PageSettingsConfig = () => {
    return (
        <>
            <PageSettings.Group
                name={"general"}
                title={"General"}
                description={
                    "Configure the page's core details like title, path, snippet, and image."
                }
                icon={<SettingsIcon />}
            >
                <PageSettings.Element name={"title"} element={<GeneralTitle />} />
                <PageSettings.Element name={"path"} element={<GeneralPath />} />
                <PageSettings.Element name={"snippet"} element={<GeneralSnippet />} />
                <PageSettings.Element name={"image"} element={<GeneralImage />} />
                <PageSettings.Element name={"tags"} element={<GeneralTags />} />
            </PageSettings.Group>
            <PageSettings.Group
                name={"seo"}
                title={"SEO"}
                description={"Optimize how this page appears in search engine results."}
                icon={<SeoIcon />}
            >
                <PageSettings.Element name={"title"} element={<SeoTitle />} />
                <PageSettings.Element name={"description"} element={<SeoDescription />} />
                <PageSettings.Element name={"metaTags"} element={<SeoMetaTags />} />
                <PageSettings.Element name={"canonicalUrl"} element={<SeoCanonicalUrl />} />
                <PageSettings.Element name={"noIndex"} element={<SeoNoIndex />} />
                <PageSettings.Element name={"noFollow"} element={<SeoNoFollow />} />
            </PageSettings.Group>
            <PageSettings.Group
                name={"social"}
                title={"Social"}
                description={"Control how this page is previewed when shared on social media."}
                icon={<SocialIcon />}
            >
                <PageSettings.Element name={"title"} element={<SocialTitle />} />
                <PageSettings.Element name={"description"} element={<SocialDescription />} />
                <PageSettings.Element name={"image"} element={<SocialImage />} />
                <PageSettings.Element name={"metaTags"} element={<SocialMetaTags />} />
            </PageSettings.Group>
            <PageSettings.Group
                name={"schema"}
                title={"Schema"}
                description={"Add structured data markup to enhance search result appearance."}
                icon={<SchemaIcon />}
            >
                <PageSettings.Element name={"editor"} element={<SchemaEditor />} />
            </PageSettings.Group>
        </>
    );
};
