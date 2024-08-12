import React from "react";
import { Root, Trigger, Close, Dialog as DialogPrimitive } from "@radix-ui/react-dialog";
import {
    Button,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "~/components";

export interface DialogProps extends React.ComponentProps<typeof Root> {
    trigger: string | React.ReactElement;
    title?: string;
    description?: string | React.ReactElement;
    content?: string | React.ReactElement;
    onAcceptLabel?: string;
    onAccept?: () => void | Promise<void>;
    onCancelLabel?: string;
    onCancel?: () => void | Promise<void>;
}

export const Dialog = ({
    trigger,
    title,
    description,
    content,
    onAcceptLabel = "Ok",
    onAccept,
    onCancelLabel = "Cancel",
    onCancel,
    ...props
}: DialogProps) => {
    return (
        <Root {...props}>
            <Trigger>{trigger}</Trigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {content}
                <DialogFooter>
                    {onCancel && (
                        <Close asChild>
                            <Button onClick={onCancel} variant={"outline"}>
                                {onCancelLabel}
                            </Button>
                        </Close>
                    )}
                    {onAccept && (
                        <Close asChild>
                            <Button onClick={onAccept} variant={"primary"}>
                                {onAcceptLabel}
                            </Button>
                        </Close>
                    )}
                </DialogFooter>
            </DialogContent>
        </Root>
    );
};

Dialog.displayName = DialogPrimitive.displayName;
