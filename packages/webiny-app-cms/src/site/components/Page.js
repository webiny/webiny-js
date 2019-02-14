// @flow
import * as React from "react";
import { Query } from "react-apollo";
import Loader from "./Loader";
import { Content, buildQueryProps, getSettings } from "./Page/index";
import { withCms } from "webiny-app-cms/context";
import type { WithCmsPropsType } from "webiny-app-cms/context";
import { get } from "lodash";
import invariant from "invariant";

const defaultPages = {
    error: null,
    notFound: null
};

type Props = { match: Object, cms: WithCmsPropsType };

const NO_404_PAGE_DEFAULT =
    "Could not fetch 404 (not found) page nor a default page was provided (set via CmsProvider).";
const NO_ERROR_PAGE_DEFAULT =
    "Could not fetch error page nor a default page was provided (set via CmsProvider).";

const Page = ({ cms, match: { url, query } }: Props) => {
    return (
        <Query query={getSettings}>
            {({ data: settings }) => (
                <Query {...buildQueryProps({ url, query, defaultPages })}>
                    {({ data, error: gqlError, loading }) => {
                        if (loading) {
                            return <Loader />;
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

                        if (page) {
                            return <Content settings={settings.settings} page={page} />;
                        }

                        if (pageError.code === "NOT_FOUND") {
                            if (defaultPages.notFound) {
                                return (
                                    <Content
                                        settings={settings.settings}
                                        page={defaultPages.notFound.data}
                                    />
                                );
                            }

                            const Component = get(cms, "defaults.pages.notFound");
                            invariant(Component, NO_404_PAGE_DEFAULT);
                            return <Component />;
                        }

                        if (defaultPages.error) {
                            return (
                                <Content
                                    settings={settings.settings}
                                    page={defaultPages.error.data}
                                />
                            );
                        }

                        const Component = get(cms, "defaults.pages.error");
                        invariant(Component, NO_ERROR_PAGE_DEFAULT);
                        return <Component />;
                    }}
                </Query>
            )}
        </Query>
    );
};

export default withCms()(Page);
