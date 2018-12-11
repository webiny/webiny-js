// @flow
import * as React from "react";
import { Query } from "react-apollo";
import { Helmet } from "react-helmet";
import Element from "webiny-app-cms/render/components/Element";
import Loader from "./Loader";
import Layout from "./Layout";
import { getPage } from "../graphql/pages";

const Page = ({ match }: Object) => {
    return (
        <Query query={getPage()} variables={{ url: match.url }}>
            {({ data, loading }) => {
                if (loading) {
                    return <Loader/>;
                }

                const { data: page, error } = data.cms.page;
                if (error) {
                    /* TODO: @cms do something reasonable here...*/
                    return <div>{error.message}</div>;
                }

                return (
                    <div className="webiny-cms-page">
                        <Helmet>
                            <meta charSet="utf-8" />
                            <title>{page.title}</title>
                            {/* TODO: @cms print data from page settings */}
                        </Helmet>
                        <Layout layout={page.settings.general.layout}>
                            <Element element={page.content} />
                        </Layout>
                    </div>
                );
            }}
        </Query>
    );
};

export default Page;
