import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import styled from "@emotion/styled";

const SimpleFormPlaceholder = styled.div({
    minHeight: 300,
    minWidth: 400
});

const t = i18n.ns("app-ssr-cache/admin/installation");

const IS_INSTALLED = gql`
    {
        ssrCache {
            isInstalled {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const INSTALL = gql`
    mutation InstallSsrCache($ssrGenerationUrl: String) {
        ssrCache {
            install(ssrGenerationUrl: $ssrGenerationUrl) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const SsrCacheInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);

    useEffect(() => {
        client
            .mutate({
                mutation: INSTALL,
                variables: { ssrGenerationUrl: window.location.origin + "/_ssr" }
            })
            .then(({ data }) => {
                const { error } = data.ssrCache.install;
                if (error) {
                    setError(error.message);
                    return;
                }

                // Just so the user sees the actual message.
                setTimeout(onInstalled, 3000);
            });
    }, []);

    return (
        <SimpleForm>
            <CircularProgress label={t`Installing SSR Cache...`} />
            {error && (
                <Alert title={t`Something went wrong`} type={"danger"}>
                    {error}
                </Alert>
            )}
            <SimpleFormContent>
                <SimpleFormPlaceholder />
            </SimpleFormContent>
        </SimpleForm>
    );
};

export default {
    name: "installation-ssr-cache",
    type: "installation",
    title: t`SSR Cache`,
    dependencies: ["installation-security"],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.ssrCache.isInstalled.data;
    },
    render({ onInstalled }) {
        return <SsrCacheInstaller onInstalled={onInstalled} />;
    }
};
