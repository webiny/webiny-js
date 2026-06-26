import React, { useMemo } from "react";
import { GraphiQL } from "graphiql";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { plugins } from "@webiny/plugins";
import { useIdentity } from "@webiny/app-admin";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { useFeature } from "@webiny/app";
import { AuthenticationContextFeature } from "@webiny/app-admin/features/security/AuthenticationContext/feature.js";
import type { GraphQLPlaygroundTabPlugin } from "~/types.js";
import "graphiql/style.css";

interface ITab {
    name: string;
    endpoint: string;
    headers: Record<string, string>;
    query: string;
}

const Playground = () => {
    const { identity } = useIdentity();
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

    const tabs = useMemo(() => {
        return plugins
            .byType<GraphQLPlaygroundTabPlugin>("graphql-playground-tab")
            .map(pl =>
                pl.tab({
                    identity: identity as Identity
                })
            )
            .filter(Boolean) as ITab[];
    }, [identity]);

    const firstTab = tabs[0];

    const fetcher = useMemo(() => {
        if (!firstTab) {
            return undefined;
        }

        return createGraphiQLFetcher({
            url: firstTab.endpoint,
            fetch: async (url, options) => {
                const idToken = await authenticationContext.getIdToken();
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
    }, [firstTab?.endpoint]);

    if (!fetcher || !firstTab) {
        return null;
    }

    return (
        <div style={{ height: "calc(100vh - 45px)" }}>
            <GraphiQL
                fetcher={fetcher}
                defaultQuery={firstTab.query}
                defaultHeaders={JSON.stringify(firstTab.headers, null, 2)}
            >
                <GraphiQL.Logo>
                    <span />
                </GraphiQL.Logo>
            </GraphiQL>
        </div>
    );
};

export { Playground };
