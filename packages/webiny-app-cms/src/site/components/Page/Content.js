// @flow
import React from "react";

import Element from "webiny-app-cms/render/components/Element";
import Layout from "./../Layout";
import { Helmet } from "react-helmet";
import { get } from "lodash";

const Content = ({ page }: { page: Object }) => {
    const seo = {
        title: "",
        description: "",
        meta: [],
        ...get(page, "settings.seo")
    };

    const social = {
        title: "",
        description: "",
        image: null,
        ...get(page, "settings.social")
    };

    return (
        <div className="webiny-cms-page">
            <Helmet>
                <meta charSet="utf-8" />
                {page.title && <title>{page.title}</title>}
                {seo.title && <meta name="title" content={seo.title} />}
                {seo.description && <meta name="description" content={seo.description} />}
                {seo.meta.map(({ name, content }, index) => (
                    <meta key={index} name={name} content={content} />
                ))}

                {social.title && <meta property="og:title" content={social.title} />}
                {social.description && (
                    <meta property="og:description" content={social.description} />
                )}
                {social.meta.map(({ property, content }, index) => (
                    <meta key={index} property={`og:${property}`} content={content} />
                ))}
            </Helmet>
            <Layout layout={page.settings.general.layout}>
                <Element element={page.content} />
            </Layout>
        </div>
    );
};

export default Content;
