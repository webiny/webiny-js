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

    return (
        <div className="webiny-cms-page">
            <Helmet>
                <meta charSet="utf-8" />
                {seo.title && <title>{page.title}</title>}
                {seo.description && <meta name="description" content={seo.description} />}
                {seo.meta.map(({ name, content }, index) => (
                    <meta key={index} name={name} content={content} />
                ))}
            </Helmet>
            <Layout layout={page.settings.general.layout}>
                <Element element={page.content} />
            </Layout>
        </div>
    );
};

export default Content;
