import { useCallback, useEffect, useState } from "react";
import type { IFullyDeleteModelState } from "../types.js";
import { FullyDeleteModelStateStatus } from "../types.js";
import type { CmsErrorResponse, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { IDeleteCmsModelTask } from "~/admin/viewsGraphql.js";

const getDefaultState = (model: CmsModel): IFullyDeleteModelState => {
    return {
        confirmation: "",
        status: FullyDeleteModelStateStatus.NONE,
        model,
        error: null,
        task: null
    };
};

export const useDialogState = (input: CmsModel) => {
    const [state, setState] = useState(() => {
        return getDefaultState(input);
    });

    const reset = useCallback(() => {
        setState(getDefaultState(input));
    }, [input]);

    const setModel = useCallback(
        (model: CmsModel) => {
            setState(prev => {
                return {
                    ...prev,
                    model
                };
            });
        },
        [setState]
    );

    const setStatusUnderstood = useCallback(() => {
        setState(prev => {
            return {
                ...prev,
                error: null,
                status: FullyDeleteModelStateStatus.UNDERSTOOD
            };
        });
    }, [setState]);

    const setStatusConfirmed = useCallback(() => {
        setState(prev => {
            return {
                ...prev,
                error: null,
                status: FullyDeleteModelStateStatus.CONFIRMED
            };
        });
    }, [setState]);

    const setStatusProcessed = useCallback(
        (task: IDeleteCmsModelTask) => {
            setState(prev => {
                return {
                    ...prev,
                    task,
                    status: FullyDeleteModelStateStatus.PROCESSED
                };
            });
        },
        [setState]
    );

    const setStatusError = useCallback(
        (error: CmsErrorResponse) => {
            setState(prev => {
                return {
                    ...prev,
                    error,
                    status: FullyDeleteModelStateStatus.ERROR
                };
            });
        },
        [setState]
    );

    const setError = useCallback(
        (error: CmsErrorResponse) => {
            setState(prev => {
                return {
                    ...prev,
                    error
                };
            });
        },
        [setState]
    );

    const setConfirmation = useCallback(
        (value: string) => {
            setState(prev => {
                return {
                    ...prev,
                    confirmation: value
                };
            });
        },
        [setState]
    );

    useEffect(() => {
        if (input === null) {
            reset();
            return;
        }

        setModel(input);
    }, [input?.modelId]);

    return {
        status: state.status,
        model: state.model,
        confirmation: state.confirmation,
        error: state.error,
        task: state.task,
        reset,
        setModel,
        setError,
        setStatusUnderstood,
        setStatusConfirmed,
        setStatusProcessed,
        setConfirmation,
        setStatusError
    };
};
