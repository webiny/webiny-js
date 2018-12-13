// @flow
import * as React from "react";
import { Query } from "react-apollo";
import Loader from "./Loader";
import { GenericErrorPage, GenericNotFoundPage, Content, buildQueryProps } from "./Page/index";

const defaultPages = {
    error: null,
    notFound: null
};

const Page = ({ match: { url } }: { match: Object }) => {
    return (
        <Query {...buildQueryProps({ url, defaultPages })}>
            {({ data, error: gqlError, loading }) => {
                if (loading) {
                    return <Loader />;
                }

                if (gqlError) {
                    return <GenericErrorPage />;
                }

                // Not pretty, but "onComplete" callback executed too late. Will be executed only once.
                if (!defaultPages.error) {
                    defaultPages.error = data.cms.errorPage;
                }

                if (!defaultPages.notFound) {
                    defaultPages.notFound = data.cms.notFoundPage;
                }

                const { data: page, error: pageError } = data.cms.page;

                if (page) {
                    return <Content page={page} />;
                }

                if (pageError.code === "NOT_FOUND") {
                    if (defaultPages.notFound) {
                        return <Content page={defaultPages.notFound.data} />;
                    }

                    return <GenericNotFoundPage />;
                }

                if (defaultPages.error) {
                    return <Content page={defaultPages.error.data} />;
                }

                return <GenericErrorPage />;
            }}
        </Query>
    );
};

export default Page;
