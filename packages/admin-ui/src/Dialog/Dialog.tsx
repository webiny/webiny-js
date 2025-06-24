import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils";
import { DialogContent } from "./components/DialogContent";
import { DialogHeader } from "~/Dialog/components/DialogHeader";
import { DialogBody } from "~/Dialog/components/DialogBody";
import { DialogFooter } from "~/Dialog/components/DialogFooter";
import { DialogOverlay } from "~/Dialog/components/DialogOverlay";
import { DialogPortal } from "./components/DialogPortal";
import { DialogRoot } from "./components/DialogRoot";
import { DialogTrigger } from "./components/DialogTrigger";
import { Icon } from "./components/Icon";
import { ConfirmButton } from "./components/ConfirmButton";
import { CancelButton } from "./components/CancelButton";
import { DialogClose } from "~/Dialog/components/DialogClose";

interface DialogProps
    extends React.ComponentPropsWithoutRef<typeof DialogRoot>,
        Omit<React.ComponentPropsWithoutRef<typeof DialogContent>, "title"> {
    trigger?: React.ReactNode;
    title?: React.ReactNode;
    icon?: React.ReactElement;
    showCloseButton?: boolean;
    dismissible?: boolean;
    bodyPadding?: boolean;
    description?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    info?: React.ReactNode;
    onClose?: () => void;
    onOpen?: () => void;
}

const DialogBase = (props: DialogProps) => {
    const {
        rootProps,
        triggerProps,
        contentProps,
        headerProps,
        bodyProps,
        footerProps,
        closeButtonProps
    } = React.useMemo(() => {
        const {
            // Root props.
            defaultOpen,
            open,
            onOpenChange: originalOnOpenChange,
            onClose,
            onOpen,
            modal,
            dir,

            // Shared props.
            size,

            // Trigger props.
            trigger,

            // Header props.
            title,
            icon,
            description,

            // Body props.
            children,
            bodyPadding,

            // Footer props.
            actions,
            info,

            // Close button props.
            showCloseButton = true,

            // Content props.
            ...rest
        } = props;

        // Handles dialog open state changes, calling original and onClose / onOpen callbacks as needed
        const onOpenChange = (open: boolean) => {
            originalOnOpenChange && originalOnOpenChange(open);

            if (onClose && !open) {
                onClose();
            }

            if (onOpen && open) {
                onOpen();
            }
        };

        return {
            rootProps: {
                defaultOpen,
                open,
                onOpenChange,
                modal,
                dir
            },
            triggerProps: {
                // Temporary fix. We need this because `ref` doesn't get passed to components
                // that are decorated with `makeDecoratable`. This will be fixed in the future.
                children: <div>{trigger}</div>
            },
            headerProps: { title, icon, description, size },
            bodyProps: { children, bodyPadding, size },
            footerProps: { info, actions, size },
            closeButtonProps: { show: showCloseButton, size },
            contentProps: { ...rest, size }
        };
    }, [props]);

    return (
        <DialogRoot {...rootProps}>
            {triggerProps.children && <DialogTrigger {...triggerProps} asChild />}
            <DialogPortal>
                <DialogOverlay />
                <DialogContent {...contentProps}>
                    <DialogHeader {...headerProps} />
                    <DialogBody {...bodyProps} />
                    <DialogFooter {...footerProps} />
                    {closeButtonProps.show && <DialogClose size={closeButtonProps.size} />}
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    );
};

DialogBase.displayName = "Dialog";

const DecoratableDialog = makeDecoratable("Dialog", DialogBase);

const Dialog = withStaticProps(DecoratableDialog, {
    ConfirmButton,
    CancelButton,
    Icon
});

export { Dialog, type DialogProps };
