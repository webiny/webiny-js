import { useCallback } from "react";
import { get, set } from "lodash";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
import { sendEvent, setProperties } from "@webiny/telemetry/react";
import * as GQL from "./graphql";

export function usePbWebsiteSettings() {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const { data, loading: queryInProgress } = useQuery(GQL.GET_SETTINGS);
    const settings = get(data, "pageBuilder.getSettings.data") || {};

    const defaultSettings = get(data, "pageBuilder.getDefaultSettings.data");

    const [update, { loading: mutationInProgress }] = useMutation(GQL.UPDATE_SETTINGS, {
        update: (cache, { data }) => {
            const dataFromCache = cache.readQuery<Record<string, any>>({ query: GQL.GET_SETTINGS });
            const updatedSettings = get(data, "pageBuilder.updateSettings.data");

            if (updatedSettings) {
                cache.writeQuery({
                    query: GQL.GET_SETTINGS,
                    data: set(dataFromCache, "pageBuilder.getSettings.data", updatedSettings)
                });
            }
        }
    });

    const editPage = useCallback(id => {
        history.push(`/page-builder/editor/${id}`);
    }, []);

    const onSubmit = useCallback(
        async data => {
            // TODO: try useForm and onSubmit
            data.websiteUrl = (data.websiteUrl || "").replace(/\/+$/g, "");

            if (settings.websiteUrl !== data.websiteUrl && !data.websiteUrl.includes("localhost")) {
                sendEvent("custom-domain", {
                    domain: data.websiteUrl
                });

                setProperties({
                    domain: data.websiteUrl
                });
            }

            delete data.id;
            await update({ variables: { data } });
            showSnackbar("Settings updated successfully.");
        },
        [settings, update]
    );

    return {
        fetching: queryInProgress,
        saving: mutationInProgress,
        saveSettings: onSubmit,
        editPage,
        settings,
        defaultSettings
    };
}
