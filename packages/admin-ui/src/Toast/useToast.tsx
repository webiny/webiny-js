import * as React from "react";
import { toast as sonnerToast, type ToasterProps as SonnerToasterProps } from "sonner";
import { ReactComponent as Check } from "@webiny/icons/check.svg";
import { ReactComponent as Warning } from "@webiny/icons/warning.svg";
import {
    ToastActions,
    ToastDescription,
    ToastTitle,
    type ToastRootProps
} from "./components/index.js";
import { Toast } from "./Toast.js";
import { Icon } from "~/Icon/index.js";
import { generateId } from "~/utils.js";

type ShowToastParams = {
    title: React.ReactElement<typeof ToastTitle> | string;
    description?: React.ReactElement<typeof ToastDescription> | string;
    icon?: React.ReactElement<typeof Icon>;
    actions?: React.ReactElement<typeof ToastActions>;
    dismissible?: boolean;
    duration?: number;
    position?: SonnerToasterProps["position"];
    variant?: ToastRootProps["variant"];
};

const useToast = () => {
    const getTitle = React.useCallback((title: React.ReactElement<typeof ToastTitle> | string) => {
        return typeof title === "string" ? <ToastTitle text={title} /> : title;
    }, []);

    const getDescription = React.useCallback(
        (description: React.ReactElement<typeof ToastDescription> | string | undefined) => {
            return typeof description === "string" ? (
                <ToastDescription text={description} />
            ) : (
                description
            );
        },
        []
    );

    const getActions = React.useCallback(
        (actions: React.ReactElement<typeof ToastActions> | any | undefined) => {
            if (!actions) {
                return null;
            }
            return typeof actions === typeof ToastActions ? (
                actions
            ) : (
                <ToastActions>{actions}</ToastActions>
            );
        },
        []
    );

    const showToast = React.useCallback(
        (params: ShowToastParams) => {
            const {
                title,
                description,
                icon,
                actions,
                variant,
                dismissible,
                duration = 6000,
                position = "bottom-left"
            } = params;

            const id = generateId();

            return sonnerToast.custom(
                toast => (
                    <Toast
                        title={getTitle(title)}
                        description={getDescription(description)}
                        icon={icon}
                        actions={getActions(actions)}
                        variant={variant}
                        onCloseClick={() => sonnerToast.dismiss(toast)}
                        dismissible={dismissible}
                    />
                ),
                {
                    id,
                    duration,
                    dismissible,
                    position
                }
            );
        },
        [getTitle, getDescription, sonnerToast]
    );

    const hideToast = React.useCallback(
        (id: number | string) => {
            return sonnerToast.dismiss(id);
        },
        [sonnerToast]
    );

    const hideAllToasts = React.useCallback(() => {
        const toastIds = sonnerToast.getToasts().map(toast => toast.id);

        if (toastIds.length === 0) {
            return;
        }

        // Dismiss each toast with a small delay between them
        // This helps ensure each dismissal is processed properly
        toastIds.forEach((id, index) => {
            setTimeout(() => {
                sonnerToast.dismiss(id);
            }, index * 50);
        });
    }, [sonnerToast]);

    const showSuccessToast = (params: ShowToastParams) => {
        return showToast({
            icon: <Icon icon={<Check />} label={""} className={"fill-success"} />,
            ...params
        });
    };

    const showWarningToast = (params: ShowToastParams) => {
        return showToast({
            icon: <Icon icon={<Warning />} label={""} className={"fill-warning"} />,
            ...params
        });
    };

    return React.useMemo(
        () => ({
            showToast,
            showSuccessToast,
            showWarningToast,
            hideToast,
            hideAllToasts
        }),
        [showToast, hideToast, hideAllToasts]
    );
};

export { useToast, type ShowToastParams };
