import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { plugins } from "@webiny/plugins";
import { PbDefaultPagePlugin, PbPageData } from "@webiny/app-page-builder/types";
import Layout from "./Layout";
import PageContent from "./PageContent";

type PageRenderProps = { error?: any; loading?: boolean; data?: PbPageData };

function PageRender({ loading, data, error }: PageRenderProps) {
    const { DefaultErrorPage, DefaultNotFoundPage } = useMemo(() => {
        const defaultErrorPagePlugin = plugins.byName<PbDefaultPagePlugin>("pb-default-page-error");
        const defaultNotFoundPagePlugin = plugins.byName<PbDefaultPagePlugin>(
            "pb-default-page-not-found"
        );

        return {
            DefaultNotFoundPage: defaultNotFoundPagePlugin.component,
            DefaultErrorPage: defaultErrorPagePlugin.component
        };
    }, []);

    if (loading) {
        return null;
    }

    if (!data) {
        if (error.code === "NOT_FOUND") {
            return DefaultNotFoundPage ? <DefaultNotFoundPage error={error} /> : null;
        }
        return DefaultErrorPage ? <DefaultErrorPage error={error} /> : null;
    }

    const head: Record<string, any> = {
        title: data.title,
        seo: {
            title: "",
            description: "",
            meta: [],
            ...(data.settings ? data.settings.seo : {})
        },
        social: {
            title: "",
            description: "",
            image: null,
            ...(data.settings ? data.settings.social : {})
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
                <PageContent data={data.content} />
            </Layout>
        </div>
    );
}

export default PageRender;
