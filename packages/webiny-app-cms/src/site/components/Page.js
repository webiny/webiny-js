// @flow
import * as React from "react";
import { Query } from "react-apollo";
import { Helmet } from "react-helmet";
import Element from "webiny-app-cms/render/components/Element";
import Loader from "./Loader";
import Layout from "./Layout";
import { getPage, getErrorPage, getHomePage, getNotFoundPage } from "../graphql/pages";

type Props = {
    match?: Object,
    isHome?: boolean,
    error?: Object
};

const getQueryProps = (props) => {
    const { error, match } = props;
    if (error) {
        return {
            query: getErrorPage
        };
    }

    if (!match) {
        return {
            query: getNotFoundPage
        };
    }

    if (match.url === "/") {
        return {
            query: getHomePage
        };
    }

    return {
        query: getPage(),
        variables: { url: match.url }
    };
};

const Page = (props: Props) => (
    <Query {...getQueryProps(props)}>
        {({ data, loading }) => {
            if (loading) {
                return <Loader />;
            }

            const { data: page, error } = data.cms.page;
            if (error) {
                if (error.code === "NOT_FOUND") {
                    return <Page />;
                }

                return <Page error={error} />;
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

export default Page;
