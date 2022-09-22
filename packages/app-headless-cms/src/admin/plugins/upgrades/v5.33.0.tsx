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
import { I18NLocaleItem } from "@webiny/app-i18n/types";
import { fetchLocales } from "./5.33.0/locales";
import { runUpgrade } from "./5.33.0/upgrade";

const t = i18n.ns("app-headless-cms/admin/installation");

const getLabel = (params: Pick<UpgradeState, "error" | "loading" | "upgrading" | "done">) => {
    const { error, loading, upgrading, done } = params;
    if (error) {
        return (
            <Alert title={t`Something went wrong`} type={"danger"}>
                {error}
            </Alert>
        );
    } else if (upgrading) {
        return t`Upgrading Headless CMS...`;
    } else if (loading) {
        return "Loading Headless CMS information";
    } else if (done) {
        return `Upgrade done.`;
    }
    return null;
};

const getLocaleList = (locales?: I18NLocaleItem[] | null) => {
    if (!locales) {
        return null;
    } else if (locales.length === 0) {
        return (
            <Grid>
                <Cell span={12}>
                    <Typography use={"body1"} tag={"div"}>
                        There are no locales to be upgraded...? This must be an error, please check
                        the log.
                    </Typography>
                </Cell>
            </Grid>
        );
    }
    return (
        <Grid>
            <Cell span={12}>
                <Typography use={"body1"} tag={"div"}>
                    List of locales to be upgraded: {locales.map(locale => locale.code).join(", ")}
                </Typography>
            </Cell>
        </Grid>
    );
};

interface UpgradeState {
    locales?: I18NLocaleItem[] | null;
    error?: string | null;
    loading: boolean;
    upgrading: boolean;
    done: boolean;
}
interface UpgradeProps {
    onInstalled: () => void;
}
const Upgrade: React.FC<UpgradeProps> = ({ onInstalled }) => {
    const client = useApolloClient();

    const [state, setState] = useState<UpgradeState>({
        locales: null,
        error: null,
        loading: false,
        upgrading: false,
        done: false
    });

    const { locales, error, loading, upgrading, done } = state;

    useEffect(() => {
        if (locales || loading || done || !!error || upgrading) {
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: true
            };
        });

        fetchLocales({ client })
            .then((locales: I18NLocaleItem[]) => {
                setState(prev => {
                    return {
                        ...prev,
                        loading: false,
                        locales
                    };
                });
            })
            .catch(ex => {
                setState(prev => {
                    return {
                        ...prev,
                        loading: false,
                        error: ex.message
                    };
                });
            });
    }, []);

    const startUpgrade = useCallback(() => {
        if (upgrading) {
            return;
        }

        setState(prev => {
            return {
                ...prev,
                upgrading: true
            };
        });
        runUpgrade({
            locales,
            client
        })
            .then(() => {
                setState(prev => {
                    return {
                        ...prev,
                        error: null,
                        upgrading: false,
                        done: true
                    };
                });
                onInstalled();
            })
            .catch((error?: Error) => {
                setState(prev => {
                    return {
                        ...prev,
                        upgrading: false,
                        done: false,
                        error: error?.message || "Unknown error. Please check the log."
                    };
                });
                console.log(`error: `, JSON.stringify(error || {}));
            });
    }, [upgrading, locales, client]);

    const label = getLabel({
        error,
        upgrading,
        done,
        loading
    });

    return (
        <SimpleForm>
            {!!label && <CircularProgress label={label} />}
            <SimpleFormHeader title={"Upgrade Headless CMS"} />
            <SimpleFormContent>
                <Grid>
                    <Cell span={12}>
                        <Typography use={"body1"} tag={"div"}>
                            This upgrade will do the following:
                            <ul>
                                <li>
                                    update all model fields in all models and locales to contain{" "}
                                    <strong>storageId</strong>
                                </li>
                            </ul>
                        </Typography>
                    </Cell>
                </Grid>
                {getLocaleList(locales)}
            </SimpleFormContent>
            <SimpleFormFooter>
                <ButtonPrimary
                    disabled={loading || upgrading || done || !!error}
                    onClick={startUpgrade}
                >
                    Upgrade
                </ButtonPrimary>
            </SimpleFormFooter>
        </SimpleForm>
    );
};

export default Upgrade;
