import React from "react";
import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "~/components";

export interface DialogProps extends React.ComponentProps<typeof Dialog> {
    trigger: string | React.ReactElement;
    title?: string;
    description?: string | React.ReactElement;
    content?: string | React.ReactElement;
    onAcceptLabel?: string;
    onAccept?: () => void | Promise<void>;
    onCancelLabel?: string;
    onCancel?: () => void | Promise<void>;
}

export const DialogComponent = ({
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
        <Dialog {...props}>
            <DialogTrigger>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {content}
                <DialogFooter>
                    {onCancel && (
                        <DialogClose asChild>
                            <Button onClick={onCancel} variant={"outline"}>
                                {onCancelLabel}
                            </Button>
                        </DialogClose>
                    )}
                    {onAccept && (
                        <DialogClose asChild>
                            <Button onClick={onAccept} variant={"primary"}>
                                {onAcceptLabel}
                            </Button>
                        </DialogClose>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

DialogComponent.displayName = Dialog.displayName;
