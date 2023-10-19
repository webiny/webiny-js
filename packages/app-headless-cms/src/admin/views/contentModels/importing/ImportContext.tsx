import React, { useCallback, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import {
    IMPORT_STRUCTURE,
    ImportStructureResponse,
    VALIDATE_IMPORT_STRUCTURE,
    ValidateImportStructureResponse
} from "~/admin/views/contentModels/importing/graphql";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";
import { ImportGroupData, ImportModelData } from "./types";
import { useSnackbar } from "@webiny/app-admin";

const parseFileData = (input: string) => {
    let data: Record<string, any> = {};
    try {
        data = JSON.parse(input);
    } catch (ex) {
        throw new Error(`Could not parse the uploaded file. Make sure it's a valid JSON file.`);
    }
    if (!data.groups?.length && !data.models?.length) {
        throw new Error(`No groups and models in the uploaded file.`);
    } else if (data.groups.length === 0) {
        throw new Error(`No groups in the uploaded file. There must be at least one group.`);
    }
    return {
        groups: data.groups,
        models: data.models
    };
};

const parseFileContent = (content?: string | ArrayBuffer | null) => {
    if (!content) {
        throw new Error(`Missing data in uploaded file.`);
    } else if (content instanceof ArrayBuffer) {
        const data = Buffer.from(content).toString("utf8");
        return parseFileData(data);
    }
    return parseFileData(content);
};

interface Data {
    groups: CmsGroup[];
    models: CmsModel[];
}

type Selected = Map<string, string[]>;

interface State {
    data: Data | null;
    loading: boolean;
    groups?: ImportGroupData[];
    models?: ImportModelData[];
    file: File | null;
    errors?: string[] | null;
    validated: boolean;
    selected: Selected;
}

export interface OnFileCb {
    (file: File): void;
}

export interface OnFileErrorCb {
    (error: string): void;
}

export interface HandleModelsValidationCb {
    (): Promise<void>;
}

export interface HandleModelsImportCb {
    (): Promise<void>;
}

export interface IsModelSelectedCb {
    (item: Pick<ImportModelData, "id">): boolean;
}

export interface IsModelRelatedCb {
    (item: Pick<ImportModelData, "id">): boolean;
}

export interface AddModelCb {
    (item: Pick<ImportModelData, "id" | "name" | "related">): void;
}

export interface RemoveModelCb {
    (item: Pick<ImportModelData, "id" | "name" | "related">): void;
}

export interface ToggleModelCb {
    (item: Pick<ImportModelData, "id" | "name" | "related">): void;
}

export interface ImportContextProperties {
    data: Data | null;
    loading: boolean;
    groups?: ImportGroupData[];
    models?: ImportModelData[];
    hasSelected: () => boolean;
    file: File | null;
    errors: string[];
    validated: boolean;
    onFile: OnFileCb;
    onFileError: OnFileErrorCb;
    handleModelsValidation: HandleModelsValidationCb;
    handleModelsImport: HandleModelsImportCb;
    toggleModel: ToggleModelCb;
    isModelSelected: IsModelSelectedCb;
    isModelRelated: IsModelRelatedCb;
}

interface GetRelatedParams {
    models?: Pick<ImportModelData, "id" | "related">[];
    related: string[];
    existing?: string[];
}

const getRelated = (params: GetRelatedParams): string[] => {
    const { models, related, existing = [] } = params;
    if (!models) {
        return [];
    }
    return related.reduce<string[]>((result, id) => {
        if (result.includes(id) || existing.includes(id)) {
            return result;
        }
        const model = models.find(model => model.id === id);
        if (!model) {
            return result;
        }
        result.push(id);
        const modelRelated = getRelated({
            models,
            related: model.related || [],
            existing: [...existing, ...result]
        });
        result.push(...modelRelated);

        return result;
    }, []);
};

interface CreateSelectedParams {
    previous: Selected;
    models: Pick<ImportModelData, "id" | "related">[];
    item: Pick<ImportModelData, "id" | "related">;
}

const createSelected = (params: CreateSelectedParams): Selected => {
    const { previous, models, item } = params;
    let selected = new Map(previous);

    selected.set(item.id, item.related);
    for (const id of item.related) {
        const model = models.find(model => model.id === id);
        if (!model) {
            continue;
        } else if (selected.has(model.id)) {
            continue;
        }
        const related = createSelected({
            previous: selected,
            models,
            item: model
        });
        selected = new Map([...selected, ...related]);
    }

    return selected;
};

export const ImportContext = React.createContext<ImportContextProperties | undefined>(undefined);

export interface ImportContextProviderProps {
    children: (props: ImportContextProperties) => React.ReactNode;
}

export const ImportContextProvider: React.VFC<ImportContextProviderProps> = ({ children }) => {
    const client = useApolloClient();

    const { showSnackbar } = useSnackbar();

    const [state, setState] = useState<State>({
        data: null,
        file: null,
        loading: false,
        validated: false,
        selected: new Map()
    });

    const hasSelected = useCallback(() => {
        return Array.from(state.selected.keys()).length > 0;
    }, [state.selected]);

    const handleModelsValidation = useCallback(async () => {
        if (!state.data) {
            console.error("Cannot import models without any data.");
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: true
            };
        });

        const result = await client.mutate<ValidateImportStructureResponse>({
            mutation: VALIDATE_IMPORT_STRUCTURE,
            variables: {
                data: state.data
            }
        });
        const { data, error } = result.data?.validateImportStructure || {};
        if (error) {
            setState(prev => {
                return {
                    ...prev,
                    errors: [error.message]
                };
            });
            return;
        } else if (!data) {
            setState(prev => {
                return {
                    ...prev,
                    errors: ["No validation data received."]
                };
            });
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: false,
                groups: data.groups.map(group => {
                    return {
                        id: group.group.id,
                        name: group.group.name,
                        error: group.error,
                        action: group.action
                    };
                }),
                models: data.models.map(model => {
                    return {
                        id: model.model.modelId,
                        name: model.model.name,
                        group: model.model.group,
                        related: model.related || [],
                        error: model.error,
                        action: model.action
                    };
                }),
                validated: true
            };
        });
    }, [state.data, setState]);

    const handleModelsImport = useCallback(async () => {
        if (!state.data) {
            console.error("Cannot import models without any data.");
            return;
        } else if (!state.groups?.length) {
            console.error("Cannot import models without any groups.");
            return;
        } else if (!state.models?.length) {
            console.error("Cannot import models because none are selected.");
            return;
        } else if (Array.from(state.selected.keys()).length === 0) {
            console.error("Cannot import models because none are selected.");
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: true
            };
        });

        const result = await client.mutate<ImportStructureResponse>({
            mutation: IMPORT_STRUCTURE,
            variables: {
                data: state.data,
                models: state.selected
            }
        });
        const { data, error } = result.data?.importStructure || {};
        if (error) {
            setState(prev => {
                return {
                    ...prev,
                    errors: [error.message]
                };
            });
            return;
        } else if (!data) {
            setState(prev => {
                return {
                    ...prev,
                    validated: false,
                    errors: ["No structure import data received."]
                };
            });
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: false,
                groups: data.groups.map(group => {
                    return {
                        id: group.group.id,
                        name: group.group.name,
                        error: group.error,
                        imported: group.imported
                    };
                }),
                models: data.models.map(model => {
                    return {
                        id: model.model.modelId,
                        name: model.model.name,
                        group: model.model.group,
                        related: model.related || [],
                        error: model.error,
                        imported: model.imported
                    };
                }),
                validated: true
            };
        });
    }, [state.selected, state.data, setState]);

    const onFile = useCallback(
        (file: File) => {
            const reader = new FileReader();
            reader.addEventListener("load", event => {
                try {
                    const data = parseFileContent(event.target?.result);
                    setState(prev => {
                        return {
                            ...prev,
                            models: undefined,
                            groups: undefined,
                            selected: new Map(),
                            errors: null,
                            validated: false,
                            file,
                            data
                        };
                    });
                } catch (ex) {
                    setState(prev => {
                        return {
                            ...prev,
                            file,
                            selected: new Map(),
                            validated: false,
                            groups: undefined,
                            models: undefined,
                            data: null,
                            errors: [ex.message]
                        };
                    });
                }
            });
            reader.readAsText(file);
        },
        [state.data, setState]
    );

    const onFileError = useCallback(
        (error: string) => {
            setState(prev => {
                return {
                    ...prev,
                    file: null,
                    errors: [error]
                };
            });
        },
        [state, setState]
    );

    const isModelSelected = useCallback<IsModelSelectedCb>(
        item => {
            return state.selected.has(item.id);
        },
        [state.selected]
    );

    const isModelRelated = useCallback<IsModelRelatedCb>(
        ({ id: target }) => {
            for (const id of state.selected.keys()) {
                if (id === target) {
                    continue;
                }
                const related = state.selected.get(id);
                if (related?.includes(id)) {
                    return true;
                }
            }
            return false;
        },
        [state.selected]
    );

    const addModel = useCallback<AddModelCb>(
        item => {
            if (isModelSelected(item)) {
                return;
            }
            setState(prev => {
                return {
                    ...prev,
                    selected: createSelected({
                        previous: prev.selected,
                        models: state.models || [],
                        item
                    })
                };
            });
        },
        [isModelSelected, state.models, state.selected]
    );
    const removeModel = useCallback<RemoveModelCb>(
        item => {
            if (isModelRelated(item)) {
                showSnackbar(
                    `Model "${item.name}" is required due to another model having a relation to it.`
                );
                return;
            }
            setState(prev => {
                const selected = prev.selected;
                selected.delete(item.id);
                return {
                    ...prev,
                    selected
                };
            });
        },
        [state, setState]
    );

    const toggleModel = useCallback<ToggleModelCb>(
        item => {
            if (isModelSelected(item)) {
                removeModel(item);
                return;
            }
            addModel(item);
        },
        [isModelSelected, addModel, removeModel]
    );

    const value: ImportContextProperties = {
        data: state.data || null,
        loading: state.loading || false,
        groups: state.groups || [],
        models: state.models || [],
        errors: state.errors || [],
        validated: state.validated || false,
        hasSelected,
        isModelRelated,
        file: state.file,
        onFile,
        onFileError,
        handleModelsValidation,
        handleModelsImport,
        toggleModel,
        isModelSelected
    };

    return <ImportContext.Provider value={value}>{children(value)}</ImportContext.Provider>;
};
