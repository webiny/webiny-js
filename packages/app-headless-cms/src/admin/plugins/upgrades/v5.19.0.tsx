import React, { useCallback, useEffect, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useApolloClient } from "@apollo/react-hooks";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { createCmsApolloClient } from "./5.19.0/createCmsApolloClient";
import { config as appConfig } from "@webiny/app/config";
import { LIST_LOCALES } from "@webiny/app-i18n/admin/views/locales/hooks/graphql";
import { CmsEditorContentModel } from "~/types";
import { Clients, ErrorValue, UpgradeItems } from "./5.19.0/types";
import { UpgradeItemsInfo } from "./5.19.0/UpgradeItemsInfo";
import { fetchModelEntries } from "./5.19.0/fetchModelEntries";
import { createRepublishMutation } from "./5.19.0/createRepublishMutation";
import { createUpgradeMutation } from "./5.19.0/createUpgradeMutation";
import { createListModelsQuery } from "./5.19.0/createListModelsQuery";

const t = i18n.ns("app-headless-cms/admin/installation");

const clients: Record<string, Clients> = {};

const getClient = (locale: string) => {
    if (!clients[locale]) {
        throw new Error(`There are no clients for locale "${locale}".`);
    }
    return clients[locale];
};
const getManageClient = (locale: string) => {
    return getClient(locale).manage;
};
const getReadClient = (locale: string) => {
    return getClient(locale).read;
};

interface CreateUpgradeItemsParams {
    locales: {
        code: string;
    }[];
}
const createUpgradeItems = (params: CreateUpgradeItemsParams): UpgradeItems => {
    const { locales } = params;
    const items: UpgradeItems = {
        loadedModels: false,
        locales: {}
    };
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    for (const locale of locales) {
        items.locales[locale.code] = null;

        clients[locale.code] = {
            read: createCmsApolloClient({
                locale: locale.code,
                apiUrl,
                endpoint: "read"
            }),
            manage: createCmsApolloClient({
                locale: locale.code,
                apiUrl,
                endpoint: "manage"
            })
        };
    }
    return items;
};

interface UpdateUpgradeItemsParams {
    previous: UpgradeItems;
    models: Record<string, CmsEditorContentModel[]>;
}
const updateUpgradeItems = (params: UpdateUpgradeItemsParams): UpgradeItems => {
    const { previous, models } = params;

    const locales: UpgradeItems["locales"] = {};
    for (const locale in previous.locales) {
        locales[locale] = (models[locale] || []).reduce((collection, model) => {
            collection[model.modelId] = {
                model,
                done: false,
                entries: [],
                upgrading: false
            };
            return collection;
        }, {});
    }
    return {
        loadedModels: true,
        locales
    };
};

type JobStatus = "pending" | "upgrading" | "completed";

const Upgrade = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState<ErrorValue>(null);
    const [loading, setLoading] = useState(false);

    const [upgrade, setUpgrade] = useState(false);

    const [status, setStatus] = useState<JobStatus>("pending");

    // const [modelsLoading, setModelsLoading] = useState(null);

    // const [models, setModels] = useState({});
    // const [clients, setClients] = useState<Clients>({});

    // const [currentlyUpgrading, setCurrentlyUpgrading] = useState<CurrentlyUpgrading>(null);

    const [upgradeItems, setUpgradeItems] = useState<UpgradeItems>(null);

    useEffect(() => {
        /**
         * Never do this if we have upgrade items.
         */
        if (upgradeItems || loading === true) {
            return;
        }
        setLoading(true);
        const fetchLocales = async () => {
            const response = await client.query({
                query: LIST_LOCALES
            });
            if (
                !response ||
                !response.data ||
                !response.data.i18n ||
                !response.data.i18n.listI18NLocales
            ) {
                console.error("Missing response when fetching locales.");
                return;
            } else if (response.data.i18n.listI18NLocales.error) {
                console.error(response.data.i18n.listI18NLocales.error.message);
                setError(error);
                return;
            }

            /**
             * New state for the upgrade items.
             */
            setUpgradeItems(() => {
                return createUpgradeItems({
                    locales: response.data.i18n.listI18NLocales.data
                });
            });
            /**
             * And stop the spinner.
             */
            setLoading(false);
        };

        fetchLocales();
    }, []);

    useEffect(() => {
        if (
            !upgradeItems ||
            !upgradeItems.locales ||
            upgradeItems.loadedModels === true ||
            loading === true
        ) {
            return;
        }

        setLoading(true);
        const fetchModels = async () => {
            const models: Record<string, CmsEditorContentModel[]> = {};
            /**
             * Load all models from locales, one by one so we dont nuke API too much.
             */
            const { locales } = upgradeItems;
            /**
             * Query does not care about locale so we can create it before the loop.
             */
            const query = createListModelsQuery();
            /**
             *
             */
            for (const locale in locales) {
                const response = (await getManageClient(locale).query({
                    query
                })) as any;
                const { listContentModels } = response.data || {};
                const { data, error } = listContentModels;
                if (error) {
                    setError(error);
                    return;
                } else if (!data) {
                    setError({
                        message: `No data received when loading all models in locale "${locale}".`
                    });
                    return;
                } else if (data.length === 0) {
                    continue;
                }
                /**
                 * We only need models that have at least one ref field or an object field that MIGHT contain ref fields.
                 */
                models[locale] = data.filter(model => {
                    return model.fields.some(
                        field => field.type === "object" || field.type === "ref"
                    );
                });
            }
            /**
             * We add models only once to skip unnecessary state changes.
             */
            setUpgradeItems(previous => {
                return updateUpgradeItems({
                    previous,
                    models: models
                });
            });
            setLoading(false);
        };

        fetchModels();
    }, [upgradeItems, loading]);

    const startUpgrade = useCallback(() => {
        if (!upgradeItems || upgradeItems.loadedModels !== true || upgrade === true) {
            return;
        }

        setUpgrade(true);
    }, [upgradeItems]);

    useEffect(() => {
        if (
            !upgrade ||
            !upgradeItems ||
            !upgradeItems.locales ||
            upgradeItems.loadedModels === false ||
            status !== "pending"
        ) {
            return;
        }

        const { locales } = upgradeItems;

        setStatus("upgrading");

        const republish = async () => {
            for (const locale in locales) {
                const localeData = locales[locale];

                const manageClient = getManageClient(locale);
                const readClient = getReadClient(locale);

                for (const modelId in localeData) {
                    const modelData = localeData[modelId];
                    /**
                     * This should never be true but let's check just in case of some missed loop breaks.
                     */
                    if (modelData.done || modelData.upgrading) {
                        continue;
                    }
                    const entries = await fetchModelEntries({
                        model: modelData.model,
                        client: readClient
                    });
                    setUpgradeItems(previous => {
                        return {
                            ...previous,
                            locales: {
                                ...previous.locales,
                                [locale]: {
                                    ...previous.locales[locale],
                                    [modelId]: {
                                        model: modelData.model,
                                        done: false,
                                        upgrading: true,
                                        entries: entries.map(id => {
                                            return {
                                                id,
                                                done: false
                                            };
                                        })
                                    }
                                }
                            }
                        };
                    });

                    const mutation = createRepublishMutation(modelData.model);

                    for (const id of entries) {
                        const republishResponse = await manageClient.mutate({
                            mutation,
                            variables: {
                                revision: id
                            }
                        });
                        const { error } = republishResponse.data.content;
                        if (error) {
                            setError(error);
                            return;
                        }
                        setUpgradeItems(previous => {
                            return {
                                ...previous,
                                locales: {
                                    ...previous.locales,
                                    [locale]: {
                                        ...previous.locales[locale],
                                        [modelId]: {
                                            model: previous.locales[locale][modelId].model,
                                            entries: previous.locales[locale][modelId].entries.map(
                                                info => {
                                                    return {
                                                        id: info.id,
                                                        done: info.done === true || id === info.id
                                                    };
                                                }
                                            ),
                                            done: false,
                                            upgrading: true
                                        }
                                    }
                                }
                            };
                        });
                    }

                    setUpgradeItems(previous => {
                        return {
                            ...previous,
                            locales: {
                                ...previous.locales,
                                [locale]: {
                                    ...previous.locales[locale],
                                    [modelId]: {
                                        model: modelData.model,
                                        entries: [],
                                        done: true,
                                        upgrading: false
                                    }
                                }
                            }
                        };
                    });
                }
            }

            const response = await client.mutate({
                mutation: createUpgradeMutation(),
                variables: {
                    version: "5.19.0"
                }
            });

            const { error } = response.data.cms.upgrade;
            setStatus("completed");
            if (error) {
                setError(error);
                return;
            }

            onInstalled();
        };

        republish();
    }, [upgrade, upgradeItems, status]);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error.message}
        </Alert>
    ) : (
        t`Upgrading Headless CMS...`
    );

    return (
        <SimpleForm>
            {(loading || error) && <CircularProgress label={label} />}
            <SimpleFormHeader title={"Upgrade Headless CMS"} />
            <SimpleFormContent>
                <Grid>
                    <Cell span={12}>
                        <Typography use={"body1"} tag={"div"}>
                            This upgrade will do the following:
                            <ul>
                                <li>update entries</li>
                            </ul>
                            <UpgradeItemsInfo upgradeItems={upgradeItems} />
                        </Typography>
                    </Cell>
                </Grid>
            </SimpleFormContent>
            <SimpleFormFooter>
                <ButtonPrimary disabled={loading || upgrade} onClick={startUpgrade}>
                    Upgrade
                </ButtonPrimary>
            </SimpleFormFooter>
        </SimpleForm>
    );
};

export default Upgrade;
