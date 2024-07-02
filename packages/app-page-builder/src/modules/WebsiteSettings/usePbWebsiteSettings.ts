import { useCallback, useState, useEffect, useMemo } from "react";
import get from "lodash/get";
import set from "lodash/set";
import debounce from "lodash/debounce";
import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { sendEvent } from "@webiny/telemetry/react";
import {
    GetSettingsQueryResponse,
    GetSettingsResponseData,
    UpdateSettingsMutationResponse,
    UpdateSettingsMutationVariables
} from "./graphql";
import { PbErrorResponse } from "~/types";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { WebsiteSettingsConfig } from "~/modules/WebsiteSettings/config/WebsiteSettingsConfig";

interface PageBuilderWebsiteSettings {
    id?: string;
    websiteUrl?: string;
}

export function usePbWebsiteSettings() {
    const { showSnackbar } = useSnackbar();
    const { navigateToPageEditor } = useNavigatePage();
    const { GET_SETTINGS, UPDATE_SETTINGS } = WebsiteSettingsConfig.useWebsiteSettingsConfig();

    const [error, setError] = useState<PbErrorResponse | null>(null);

    const [getSettings, { data, loading: queryInProgress }] =
        useLazyQuery<GetSettingsQueryResponse>(GET_SETTINGS);

    const settings: Partial<GetSettingsResponseData> = data?.pageBuilder.getSettings.data || {};
    const defaultSettings: Partial<GetSettingsResponseData> =
        data?.pageBuilder.getDefaultSettings.data || {};

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

    const debouncedGetSettings = useMemo(() => {
        return debounce(getSettings, 20);
    }, []);

    useEffect(() => {
        debouncedGetSettings();
    }, []);

    const onSubmit = useCallback(
        /**
         * Figure out correct type for data.
         */
        async (data: PageBuilderWebsiteSettings) => {
            // TODO: try useForm and onSubmit
            data.websiteUrl = (data.websiteUrl || "").replace(/\/+$/g, "");

            const logWebsiteUrl =
                settings.websiteUrl !== data.websiteUrl && !data.websiteUrl.includes("localhost");
            if (logWebsiteUrl) {
                // We don't want to await the result, so that we don't block the UI.
                sendEvent("admin-custom-domain", {
                    domain: data.websiteUrl
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
