// @flow
import React from "react";

import Element from "webiny-app-cms/render/components/Element";
import Layout from "./../Layout";
import { Helmet } from "react-helmet";

const Content = ({ page }: { page: Object }) => {
    return (
        <div className="webiny-cms-page">
            <Helmet>
                <meta charSet="utf-8" />
                <title>{page.title}</title>
            </Helmet>
            <Layout layout={page.settings.general.layout}>
                <Element element={page.content} />
            </Layout>
        </div>
    );
};

export default Content;
