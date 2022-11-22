import React from "react";
import { Helmet } from "react-helmet";
import {
    PbErrorResponse,
    PbPageData,
    PbPageDataSettingsSeo,
    PbPageDataSettingsSocial
} from "@webiny/app-page-builder/types";
import Layout from "./Layout";
import Element from "@webiny/app-page-builder/render/components/Element";
import useResponsiveClassName from "@webiny/app-page-builder/hooks/useResponsiveClassName";
import DefaultNotFoundPage from "theme/pageBuilder/components/defaultPages/DefaultNotFoundPage";
import DefaultErrorPage from "theme/pageBuilder/components/defaultPages/DefaultErrorPage";
import { SettingsQueryResponseData } from "./graphql";

const htmlStringToReactHelmet = (str: string) => {
    if (!str) {
        return null;
    }

    const dom = new DOMParser().parseFromString(str, "text/html");
    const elements = dom.documentElement.querySelectorAll(":not(html):not(head):not(body)");
    const parsedElementsArray: JSX.Element[] = [];

    elements.forEach((el, index) => {
        const NodeName = el.nodeName.toLowerCase();
        const attributes = Object.fromEntries(
            [...el.attributes].map(({ name, value }) => [name, value])
        );
        parsedElementsArray.push(<NodeName key={index} {...attributes} />);
    });

    return <Helmet>{parsedElementsArray.map(element => element)}</Helmet>;
};

interface Head {
    favicon?: {
        src: string;
    };
    title: string;
    seo: PbPageDataSettingsSeo;
    social: PbPageDataSettingsSocial;
    htmlTags: JSX.Element | null;
}

/**
 * This component will render the page, including the page content, its layout, and also meta tags.
 */
interface RenderProps {
    page: PbPageData | null;
    error: PbErrorResponse | null;
    settings: SettingsQueryResponseData;
}
const Render: React.FC<RenderProps> = ({ page, error, settings }) => {
    const { pageElementRef, responsiveClassName } = useResponsiveClassName();

    if (error) {
        if (error.code === "NOT_FOUND") {
            return <DefaultNotFoundPage />;
        }
        return <DefaultErrorPage error={error} />;
    }

    if (!page) {
        return null;
    }

    const head: Head = {
        favicon: settings.favicon,
        title: page.title || settings.name,
        seo: {
            title: "",
            description: "",
            meta: [],
            ...(page.settings?.seo || {})
        },
        social: {
            title: "",
            description: "",
            image: null,
            meta: [],
            ...(page.settings?.social || {})
        },
        htmlTags: htmlStringToReactHelmet(settings?.htmlTags?.header)
    };

    return (
        <div className="webiny-pb-page">
            <ps-tag data-key={"pb-page"} data-value={page.id} />
            <Helmet>
                {/* Read favicon from settings. */}
                {head.favicon && (
                    <link
                        rel="icon"
                        type="image/png"
                        href={head.favicon.src + "?width=128"}
                        sizes="16x16"
                    />
                )}

                {/* Read title from page settings. */}
                {head.title && <title>{head.title}</title>}

                {/* Read SEO tags from page settings. */}
                {head.seo.title && <meta name="title" content={head.seo.title} />}
                {head.seo.description && <meta name="description" content={head.seo.description} />}
                {head.seo.meta.map(({ name, content }, index) => (
                    <meta key={index} name={name} content={content} />
                ))}

                {/* Read social tags from page settings. */}
                {head.seo?.title && <meta property="og:title" content={head.seo.title} />}

                {head.social.image && (
                    <meta property="og:image" content={head.social.image.src + "?width=1596"} />
                )}
                {head.social.title && <meta property="og:title" content={head.social.title} />}

                {head.social.description && (
                    <meta property="og:description" content={head.social.description} />
                )}
                {head.social.meta.map(({ property, content }, index) => {
                    // Replace duplicate "og:og:" with single "og:".
                    const preparedProperty = `og:${property}`.replace("og:og:", "og:");
                    return <meta key={index} property={preparedProperty} content={content} />;
                })}
            </Helmet>
            {head.htmlTags}
            <div className={responsiveClassName} ref={pageElementRef}>
                <Layout page={page} settings={settings}>
                    <Element element={page.content} />
                </Layout>
            </div>
            {settings.htmlTags?.footer && (
                <div dangerouslySetInnerHTML={{ __html: settings.htmlTags.footer }} />
            )}
        </div>
    );
};

export default Render;
