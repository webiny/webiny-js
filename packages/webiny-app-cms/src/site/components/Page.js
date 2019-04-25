// @flow
import * as React from "react";
import type { Location } from "react-router-dom";
import { Query } from "react-apollo";
import { Content, buildQueryProps } from "./Page/index";
import { withCms } from "webiny-app-cms/context";
import type { WithCmsPropsType } from "webiny-app-cms/context";
import { get } from "lodash";
import invariant from "invariant";
import { CircularProgress } from "webiny-ui/Progress";

const defaultPages = {
    error: null,
    notFound: null
};

type Props = { match: Object, location: Location, cms: WithCmsPropsType };

const NO_404_PAGE_DEFAULT =
    "Could not fetch 404 (not found) page nor was a default page provided (set via CmsProvider).";
const NO_ERROR_PAGE_DEFAULT =
    "Could not fetch error page nor was a default page provided (set via CmsProvider).";

const Page = ({ cms, location }: Props) => {
    const props = buildQueryProps({ location, defaultPages });

    return (
        <Query {...props}>
            {({ data, error: gqlError, loading }) => {
                if (loading) {
                    return <CircularProgress />;
                }

                if (gqlError) {
                    const Component = get(cms, "defaults.pages.error");
                    invariant(Component, NO_ERROR_PAGE_DEFAULT);

                    return <Component />;
                }

                // Not pretty, but "onComplete" callback executed too late. Will be executed only once.
                if (!defaultPages.error) {
                    defaultPages.error = data.cms.errorPage;
                }

                if (!defaultPages.notFound) {
                    defaultPages.notFound = data.cms.notFoundPage;
                }

                const { data: page, error: pageError } = data.cms.page;
                const { data: settings } = data.settings.cms;

                if (page) {
                    return <Content settings={settings} page={page} />;
                }

                if (pageError.code === "NOT_FOUND") {
                    if (defaultPages.notFound) {
                        return <Content settings={settings} page={defaultPages.notFound.data} />;
                    }

                    const Component = get(cms, "defaults.pages.notFound");
                    invariant(Component, NO_404_PAGE_DEFAULT);
                    return <Component />;
                }

                if (defaultPages.error) {
                    return <Content settings={settings} page={defaultPages.error.data} />;
                }

                const Component = get(cms, "defaults.pages.error");
                invariant(Component, NO_ERROR_PAGE_DEFAULT);
                return <Component />;
            }}
        </Query>
    );
};

export default withCms()(Page);
