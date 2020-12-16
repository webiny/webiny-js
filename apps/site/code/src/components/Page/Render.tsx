import React from "react";
import { Helmet } from "react-helmet";
import { PbPageData } from "@webiny/app-page-builder/types";
import Layout from "./Layout";
import Element from "@webiny/app-page-builder/render/components/Element";
import DefaultNotFoundPage from "theme/pageBuilder/components/defaultPages/DefaultNotFoundPage";
import DefaultErrorPage from "theme/pageBuilder/components/defaultPages/DefaultErrorPage";

/**
 * This component will render the page, including the page content, its layout, and also meta tags.
 * @param data
 * @param error
 * @constructor
 */
function Render({ data, error }: { error?: any; data?: PbPageData }) {
    if (error) {
        if (error.code === "NOT_FOUND") {
            return <DefaultNotFoundPage />;
        }
        return <DefaultErrorPage error={error} />;
    }

    if (!data) {
        return null;
    }

    const head: Record<string, any> = {
        title: data.title,
        seo: {
            title: "",
            description: "",
            meta: [],
            ...data?.settings?.seo
        },
        social: {
            title: "",
            description: "",
            image: null,
            ...data?.settings?.social
        }
    };

    return (
        <div className="webiny-pb-page">
            <Helmet>
                {head.title && <title>{head.title}</title>}
                {head.seo.title && <meta name="title" content={head.seo.title} />}
                {head.seo.description && <meta name="description" content={head.seo.description} />}
                {head.seo.meta.map(({ name, content }, index) => (
                    <meta key={index} name={name} content={content} />
                ))}

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
            <Layout layout={data.settings.general.layout}>
                <Element element={data.content} />
            </Layout>
        </div>
    );
}

export default Render;
