import React, { useMemo } from "react";
import { GraphiQL } from "graphiql";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { plugins } from "@webiny/plugins";
import { useIdentity } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { AuthenticationContextFeature } from "@webiny/app-admin/features/security/AuthenticationContext/feature.js";
import { Tabs } from "@webiny/admin-ui";
import type { GraphQLPlaygroundTabPlugin, GraphQLPlaygroundTab } from "~/types.js";
import "graphiql/style.css";

interface GraphiQLTabProps {
    tab: GraphQLPlaygroundTab;
    getIdToken: () => Promise<string | undefined> | string | undefined;
}

const GraphiQLTab = ({ tab, getIdToken }: GraphiQLTabProps) => {
    const fetcher = useMemo(() => {
        return createGraphiQLFetcher({
            url: tab.endpoint,
            fetch: async (url, options) => {
                const idToken = await getIdToken();
                const headers = new Headers(options?.headers);

                if (idToken) {
                    headers.set("Authorization", `Bearer ${idToken}`);
                }

                return fetch(url, {
                    ...options,
                    headers,
                    credentials: "include"
                });
            }
        });
    }, [tab.endpoint]);

    return (
        <div style={{ height: "calc(100vh - 90px)" }}>
            <GraphiQL
                fetcher={fetcher}
                defaultQuery={tab.query}
                defaultHeaders={JSON.stringify(tab.headers, null, 2)}
            >
                <GraphiQL.Logo>
                    <span />
                </GraphiQL.Logo>
            </GraphiQL>
        </div>
    );
};

const Playground = () => {
    const { identity } = useIdentity();
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

    const tabs = useMemo(() => {
        return plugins
            .byType<GraphQLPlaygroundTabPlugin>("graphql-playground-tab")
            .map(pl =>
                pl.tab({
                    identity: identity!
                })
            )
            .filter(Boolean) as GraphQLPlaygroundTab[];
    }, [identity]);

    if (tabs.length === 0) {
        return null;
    }

    return (
        <Tabs
            tabs={tabs.map(tab => (
                <Tabs.Tab
                    key={tab.endpoint}
                    value={tab.endpoint}
                    trigger={tab.name}
                    content={
                        <GraphiQLTab
                            tab={tab}
                            getIdToken={() => authenticationContext.getIdToken()}
                        />
                    }
                />
            ))}
        />
    );
};

export { Playground };
