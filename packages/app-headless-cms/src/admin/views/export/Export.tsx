import React, { useCallback, useState } from "react";
import { Group } from "./Group";
import { useGroupsQuery } from "./query";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";
import { useApolloClient } from "~/admin/hooks";
import { runExport } from "./runExport";
import { useSnackbar } from "@webiny/app-admin";
import { download } from "./download";

interface Selected {
    group: string;
    models: string[];
}

const Export: React.VFC = () => {
    const [state, setState] = useState<Selected[]>([]);
    const { groups, error, loading } = useGroupsQuery();

    const { showSnackbar } = useSnackbar();

    const client = useApolloClient();

    const toggleGroup = useCallback(
        (group: Pick<CmsGroup, "id"> | string) => {
            const id = typeof group === "string" ? group : group.id;
            setState(prev => {
                const exists = state.find(item => item.group === id);
                if (exists) {
                    return prev.filter(item => item.group !== id);
                }
                return [
                    ...prev,
                    {
                        group: id,
                        models: []
                    }
                ];
            });
        },
        [state, groups]
    );

    const toggleModel = useCallback(
        (model: Pick<CmsModel, "modelId"> | string) => {
            const modelId = typeof model === "string" ? model : model.modelId;

            console.log(`toggling ${modelId}`);
            if (!groups?.length) {
                console.log("no groups");
                return;
            }
            const group = groups.find(group =>
                group.contentModels.find(m => m.modelId === modelId)
            );
            if (!group) {
                console.log("no group found");
                return;
            }
            const groupStateIndex = state.findIndex(item => item.group === group.id);
            console.log(`groupStateIndex: ${groupStateIndex}`);
            setState(prev => {
                /**
                 * No group selected at all.
                 */
                //
                if (groupStateIndex === -1) {
                    return [
                        ...prev,
                        {
                            group: group.id,
                            models: [modelId]
                        }
                    ];
                }

                const modelStateIndex = state[groupStateIndex].models.findIndex(
                    item => item === modelId
                );
                /**
                 * There is a group selected, but the model is not selected - add it.
                 */
                if (modelStateIndex === -1) {
                    const next = [...prev];
                    next[groupStateIndex].models = [...next[groupStateIndex].models, modelId];
                    return next;
                }
                /**
                 * Model is already selected, we want to remove it.
                 */
                return prev.map(item => {
                    if (item.group !== group.id) {
                        return item;
                    }
                    return {
                        ...item,
                        models: item.models.filter(id => id !== modelId)
                    };
                });
            });
        },
        [state, groups]
    );

    const setSelectAll = useCallback(() => {
        if (!groups?.length) {
            return;
        }
        setState(() => {
            return groups.map(group => {
                return {
                    group: group.id,
                    models: group.contentModels.map(model => model.modelId)
                };
            });
        });
    }, [state, groups]);

    const isGroupSelected = useCallback(
        (group: string | Pick<CmsGroup, "id">) => {
            const id = typeof group === "string" ? group : group.id;
            return state.some(item => item.group === id);
        },
        [state]
    );
    const isModelSelected = useCallback(
        (model: string | Pick<CmsModel, "modelId">) => {
            const modelId = typeof model === "string" ? model : model.modelId;
            return state.some(item => item.models.includes(modelId));
        },
        [state]
    );

    const onExportClick = useCallback(async () => {
        if (state.length === 0) {
            return;
        }
        const { data, error } = await runExport({
            client,
            state
        });
        if (error) {
            showSnackbar(error.message);
            return;
        } else if (!data) {
            showSnackbar("Something went wrong... No error but no data either. Please check logs.");
            return;
        }
        download(data);
    }, [state]);

    if (error) {
        return (
            <div>
                <div>Something went wrong...</div>
                <div>{error.message}</div>
            </div>
        );
    } else if (loading) {
        return <div>Loading...</div>;
    } else if (!groups || groups.length === 0) {
        return <div>No content model groups found.</div>;
    }

    return (
        <>
            {groups.map(group => {
                return (
                    <Group
                        key={`group-${group.id}`}
                        group={group}
                        toggleGroup={toggleGroup}
                        toggleModel={toggleModel}
                        isGroupSelected={isGroupSelected}
                        isModelSelected={isModelSelected}
                    />
                );
            })}
            <div>
                <button onClick={onExportClick} disabled={state.length === 0}>
                    Export!
                </button>
                <button onClick={setSelectAll}>Select all</button>
                <button onClick={() => setState([])}>Deselect all</button>
            </div>
        </>
    );
};
export default Export;
