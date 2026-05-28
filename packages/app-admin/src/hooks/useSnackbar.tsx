import React from "react";
import { Toast, useToast } from "@webiny/admin-ui";

interface UseSnackbarResponse {
    showSnackbar: (message: React.ReactNode, options?: Record<string, React.ReactNode>) => void;
    showErrorSnackbar: (
        message: React.ReactNode,
        options?: Record<string, React.ReactNode>
    ) => void;
    hideSnackbar: () => void;
}

/**
 * @deprecated Use the new `useToast` hook from `@webiny/admin-ui` instead.
 */
export const useSnackbar = (): UseSnackbarResponse => {
    const { showToast, hideAllToasts } = useToast();

    return {
        showSnackbar: (message, options = {}) => {
            showToast({
                title: <Toast.Title text={message} />,
                ...options
            });
        },
        showErrorSnackbar: (message, options = {}) => {
            showToast({
                title: <Toast.Title text={message} />,
                duration: Infinity,
                ...options
            });
        },
        hideSnackbar: () => {
            hideAllToasts();
        }
    };
};
