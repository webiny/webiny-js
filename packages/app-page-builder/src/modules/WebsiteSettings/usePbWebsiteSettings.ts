import { useCallback } from "react";
import { get, set } from "lodash";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
/**
 * Package @webiny/telemetry is missing types.
 */
// @ts-ignore
import { sendEvent, setProperties } from "@webiny/telemetry/react";
import {
    GET_SETTINGS,
    UPDATE_SETTINGS,
    GetSettingsQueryResponse,
    GetSettingsResponseData,
    UpdateSettingsMutationResponse,
    UpdateSettingsMutationVariables
} from "./graphql";

interface PageBuilderWebsiteSettings {
    websiteUrl?: string;
}

export function usePbWebsiteSettings() {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const { data, loading: queryInProgress } = useQuery<GetSettingsQueryResponse>(GET_SETTINGS);
    const settings = get(
        data,
        "pageBuilder.getSettings.data",
        {}
    ) as unknown as GetSettingsResponseData;

    const defaultSettings = get(
        data,
        "pageBuilder.getDefaultSettings.data",
        {}
    ) as unknown as GetSettingsResponseData;

    const [update, { loading: mutationInProgress }] = useMutation<
        UpdateSettingsMutationResponse,
        UpdateSettingsMutationVariables
    >(UPDATE_SETTINGS, {
        update: (cache, { data }) => {
            const dataFromCache = cache.readQuery<GetSettingsQueryResponse>({
                query: GET_SETTINGS
            });
            if (!dataFromCache) {
                return;
            }
            const updatedSettings = get(data, "pageBuilder.updateSettings.data");

            if (updatedSettings) {
                cache.writeQuery({
                    query: GET_SETTINGS,
                    data: set(dataFromCache, "pageBuilder.getSettings.data", updatedSettings)
                });
            }
        }
    });

    const editPage = useCallback(id => {
        history.push(`/page-builder/editor/${id}`);
    }, []);

    const onSubmit = useCallback(
        /**
         * Figure out correct type for data.
         */
        async (data: PageBuilderWebsiteSettings) => {
            // TODO: try useForm and onSubmit
            data.websiteUrl = (data.websiteUrl || "").replace(/\/+$/g, "");

            if (settings.websiteUrl !== data.websiteUrl && !data.websiteUrl.includes("localhost")) {
                /**
                 * sendEvent is async, why is it not awaited?
                 */
                // TODO @ts-refactor
                sendEvent("custom-domain", {
                    domain: data.websiteUrl
                });

                /**
                 * setProperties is async, why is it not awaited?
                 */
                // TODO @ts-refactor
                setProperties({
                    domain: data.websiteUrl
                });
            }

            // TODO @ts-refactor
            delete (data as any).id;
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
