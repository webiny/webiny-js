// @flow
import * as React from "react";
import { Query } from "react-apollo";
import Element from "webiny-app-cms/render/components/Element";
import Loader from "./Loader";
import Layout from "./Layout";
import { Helmet } from "react-helmet";
import { Body, GenericErrorPage, GenericNotFoundPage, getQueryProps } from "./Page/index";

type Props = {
    match?: Object,
    isHome?: boolean,
    error?: Object
};

const Page = (props: Props) => (
    <Query {...getQueryProps(props)}>
        {({ data, error: gqlError, loading }) => {
            if (loading) {
                return <Loader />;
            }

            if (gqlError) {
                if (props.error) {
                    // Let's show a generic system error.
                    return <GenericErrorPage />;
                }

                return <Page error={gqlError} />;
            }

            const { data: page, error } = data.cms.page;
            if (page) {
                return (
                    <Body>
                        <>
                            <Helmet>
                                <meta charSet="utf-8" />
                                <title>{page.title}</title>
                            </Helmet>
                            <Layout layout={page.settings.general.layout}>
                                <Element element={page.content} />
                            </Layout>
                        </>
                    </Body>
                );
            }

            if (error.code !== "NOT_FOUND") {
                return <Page error={error} />;
            }

            // Page not found error handling. Note that generic error messages should not be needed
            // often, since these pages will be defined in the CMS install process.

            // If we received an error via props, that means we tried to load error page but it wasn't found.
            if (props.error) {
                return <GenericErrorPage />;
            }

            // If we didn't receive "match", that means we tried to load 404 page, but again, it wasn't found.
            if (!props.match) {
                return <GenericNotFoundPage />;
            }

            return <Page />;
        }}
    </Query>
);

export default Page;
