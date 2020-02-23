import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { get } from "lodash";
import Layout from "./Layout";
import PageContent from "./PageContent";
import { getPlugin, getPlugins } from "@webiny/plugins";
import {
    PbPageLayoutComponentPlugin,
    PbDefaultPagePlugin,
    PbPageData
} from "@webiny/app-page-builder/types";

type PageRenderProps = { error?: any; loading?: boolean; data?: PbPageData };

function PageRender({ loading, data, error }: PageRenderProps) {
    const Loader = useMemo(() => {
        const plugins = getPlugins<PbPageLayoutComponentPlugin>("pb-layout-component");
        const pl = plugins.find(pl => pl.componentType === "loader");
        return pl ? pl.component : null;
    }, []);

    const { DefaultErrorPage, DefaultNotFoundPage } = useMemo(() => {
        const defaultErrorPagePlugin = getPlugin<PbDefaultPagePlugin>("pb-default-page-error");
        const defaultNotFoundPagePlugin = getPlugin<PbDefaultPagePlugin>(
            "pb-default-page-not-found"
        );

        return {
            DefaultNotFoundPage: defaultNotFoundPagePlugin?.component,
            DefaultErrorPage: defaultErrorPagePlugin?.component
        };
    }, []);

    if (loading) {
        return Loader ? <Loader /> : null;
    }

    if (!data) {
        if (error?.code === "NOT_FOUND") {
            return DefaultNotFoundPage ? <DefaultNotFoundPage error={error} /> : null;
        }
        return DefaultErrorPage ? <DefaultErrorPage error={error} /> : null;
    }

    const head = {
        title: data.title,
        seo: {
            title: "",
            description: "",
            meta: [],
            ...get(data, "settings.seo")
        },
        social: {
            title: "",
            description: "",
            image: null,
            ...get(data, "settings.social")
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
            <Layout layout={data?.settings?.general?.layout}>
                <PageContent data={data.content} />
            </Layout>
        </div>
    );
}

export default PageRender;
