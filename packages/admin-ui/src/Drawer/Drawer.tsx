import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { DrawerContent } from "./components/DrawerContent.js";
import { DrawerFooter } from "./components/DrawerFooter.js";
import { DrawerHeader } from "./components/DrawerHeader.js";
import { DrawerOverlay } from "./components/DrawerOverlay.js";
import { DrawerPortal } from "./components/DrawerPortal.js";
import { DrawerRoot } from "./components/DrawerRoot.js";
import { DrawerTrigger } from "./components/DrawerTrigger.js";
import { DrawerBody } from "~/Drawer/components/DrawerBody.js";
import { Icon } from "./components/Icon.js";
import { ConfirmButton } from "./components/ConfirmButton.js";
import { CancelButton } from "./components/CancelButton.js";

interface DrawerProps
    extends React.ComponentPropsWithoutRef<typeof DrawerRoot>,
        Omit<React.ComponentPropsWithoutRef<typeof DrawerContent>, "title"> {
    trigger?: React.ReactNode;
    title?: React.ReactNode;
    icon?: React.ReactElement;
    modal?: boolean;
    showCloseButton?: boolean;
    bodyPadding?: boolean;
    headerSeparator?: boolean;
    footerSeparator?: boolean;
    description?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    info?: React.ReactNode;
    width?: React.CSSProperties["width"];
    onClose?: () => void;
    onOpen?: () => void;
}

const DrawerBase = (props: DrawerProps) => {
    const { rootProps, triggerProps, contentProps, headerProps, bodyProps, footerProps } =
        React.useMemo(() => {
            const {
                // Root props.
                defaultOpen,
                open,
                onOpenChange: originalOnOpenChange,
                onClose,
                onOpen,

                // We want the drawer to always allow interaction with the outside elements.
                modal = false,
                dir,

                // Trigger props.
                trigger,

                // Header props.
                title,
                icon,
                description,
                showCloseButton,
                headerSeparator,

                // Body props.
                children,
                bodyPadding,

                // Footer props.
                actions,
                info,
                footerSeparator,

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
                headerProps: {
                    title,
                    icon,
                    description,
                    showCloseButton,
                    separator: headerSeparator
                },
                bodyProps: { children, bodyPadding },
                footerProps: { info, actions, separator: footerSeparator },
                contentProps: rest
            };
        }, [props]);

    return (
        <DrawerRoot {...rootProps}>
            {triggerProps.children && <DrawerTrigger {...triggerProps} asChild />}
            <DrawerPortal>
                <div data-role="drawer" className={"absolute z-overlay"}>
                    {rootProps.modal && <DrawerOverlay />}
                    <DrawerContent {...contentProps} modal={rootProps.modal}>
                        <DrawerHeader {...headerProps} />
                        <DrawerBody {...bodyProps} />
                        <DrawerFooter {...footerProps} />
                    </DrawerContent>
                </div>
            </DrawerPortal>
        </DrawerRoot>
    );
};

DrawerBase.displayName = "Drawer";

const DecoratableDrawer = makeDecoratable("Drawer", DrawerBase);

const Drawer = withStaticProps(DecoratableDrawer, {
    ConfirmButton,
    CancelButton,
    Icon
});

export { Drawer, type DrawerProps };
