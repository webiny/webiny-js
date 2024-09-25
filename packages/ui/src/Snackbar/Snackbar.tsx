import React, { useCallback, useMemo } from "react";
import { Toast, ToastTitle, ToastAction, ToastActionProps } from "@webiny/admin-ui";
import { ButtonProps } from "~/Button";

type CustomEventT<T> = CustomEvent<T> & React.SyntheticEvent<EventTarget>;

type SnackbarActionProps = ButtonProps & {
    /** Content specified as a label prop. */
    label?: React.ReactNode | any;
    /** An action returned in evt.detail.reason to the onClose handler. */
    action?: string;
};

type ToastActionWithDataActionProps = ToastActionProps & {
    "data-action"?: string;
};

type SnackbarProps = {
    open?: boolean;
    /** A callback thats fired when the Snackbar shows. */
    onOpen?: (evt: CustomEventT<any>) => void;
    /** A callback thats fired when the Snackbar hides. evt.detail = { reason?: string } */
    onClose?: (
        evt: CustomEventT<{
            reason?: string;
        }>
    ) => void;
    /** A string or other renderable JSX to be used as the message body. */
    message?: React.ReactNode;
    /** One or more actions to add to the snackbar. */
    action?:
        | React.ReactElement<ToastActionWithDataActionProps>
        | React.ReactElement<ToastActionWithDataActionProps>[];
    /** Milliseconds to show the Snackbar for. Set to -1 to show indefinitely. */
    timeout?: number;
    /** Places the action underneath the message text. */
    stacked?: boolean;
    leading?: boolean;
    dismissIcon?: boolean | React.ReactNode;
    /** Whether or not your want clicking an action to close the Snackbar. */
    dismissesOnAction?: boolean;
    /** An icon for the snackbar */
    icon?: React.ReactNode;
};

// Utility function to create a custom event
const createCustomEvent = <T = any,>(eventType: string, detail: T): CustomEvent<T> => {
    return new CustomEvent<T>(eventType, { detail });
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Toast` component from the `@webiny/admin-ui` package instead.
 */
const Snackbar = ({ onOpen, onClose, action, dismissesOnAction, open, message }: SnackbarProps) => {
    // Function to map Snackbar actions to Toast actions
    const renderActions = useMemo(() => {
        if (!action) {
            return [];
        }

        const actions = Array.isArray(action) ? action : [action];

        return actions
            .filter(action => React.isValidElement(action))
            .map((action, index) => {
                return React.cloneElement(action, {
                    key: `action-${index}`,
                    onClick: (e: React.MouseEvent<any, MouseEvent>) => {
                        // Fire onClose event if dismissesOnAction is true
                        if (dismissesOnAction && typeof onClose === "function") {
                            const closeEvent = new CustomEvent("snackbarClose", {
                                detail: {
                                    reason: action.props["data-action"]
                                }
                            });
                            onClose(closeEvent as unknown as CustomEventT<{ reason?: string }>);
                        }

                        // Call any onClick handler defined on the action
                        if (
                            React.isValidElement(action) &&
                            typeof action.props?.onClick === "function"
                        ) {
                            action.props.onClick(e);
                        }
                    }
                });
            });
    }, [action, dismissesOnAction, onClose]);

    // Function to map Snackbar actions to Toast actions
    const handleOpenChange = useCallback(
        (open: boolean) => {
            // Create the event for opening
            const openEvent = createCustomEvent("snackbarChange", { open });

            if (onOpen && open) {
                onOpen(openEvent as unknown as CustomEventT<any>);
            }

            if (onClose && !open) {
                // Create the event for closing with a specific reason
                const closeEvent = createCustomEvent("snackbarChange", {
                    open,
                    reason: "closed"
                });

                onClose(closeEvent as unknown as CustomEventT<{ reason?: string }>);
            }
        },
        [onOpen, onClose]
    );

    return (
        <Toast
            title={<ToastTitle text={message} />}
            actions={renderActions}
            open={open}
            onOpenChange={handleOpenChange}
        />
    );
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `ToastAction` component from the `@webiny/admin-ui` package instead.
 */
const SnackbarAction = ({
    label,
    action,
    onClick
}: SnackbarActionProps): React.ReactElement<ToastActionProps & { "data-action"?: string }> => {
    return (
        <ToastAction
            text={label}
            altText={React.isValidElement(label) ? "Custom action" : String(label)}
            onClick={onClick}
            data-action={action}
        />
    );
};

export { Snackbar, SnackbarAction };
