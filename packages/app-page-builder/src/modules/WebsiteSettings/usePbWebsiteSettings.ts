import { useCallback, useState } from "react";
import get from "lodash/get";
import set from "lodash/set";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { sendEvent, setProperties } from "@webiny/telemetry/react";
import {
    GET_SETTINGS,
    GetSettingsQueryResponse,
    GetSettingsResponseData,
    UPDATE_SETTINGS,
    UpdateSettingsMutationResponse,
    UpdateSettingsMutationVariables
} from "./graphql";
import { PbErrorResponse } from "~/types";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

interface PageBuilderWebsiteSettings {
    id?: string;
    websiteUrl?: string;
}

export function usePbWebsiteSettings() {
    const { showSnackbar } = useSnackbar();
    const { navigateToPageEditor } = useNavigatePage();

    const [error, setError] = useState<PbErrorResponse | null>(null);

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
                // TODO @pavel
                sendEvent("custom-domain", {
                    domain: data.websiteUrl,
                });
            }

            delete data.id;
            const response = await update({ variables: { data } });
            const responseError = response.data?.pageBuilder.updateSettings.error;
            setError(responseError || null);
            if (responseError) {
                showSnackbar(responseError.message);
                return;
            }
            showSnackbar("Settings updated successfully.");
        },
        [settings, update]
    );

    return {
        fetching: queryInProgress,
        saving: mutationInProgress,
        saveSettings: onSubmit,
        editPage: navigateToPageEditor,
        settings,
        defaultSettings,
        error
    };
}
