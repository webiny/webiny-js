import React, { useCallback, useEffect, useState } from "react";
import { ReactComponent as GlobeIcon } from "@webiny/icons/language.svg";
import { Button, DropdownMenu, IconButton, Separator, Input, cn } from "@webiny/admin-ui";
import { usePreviewDomain } from "../usePreviewDomain.js";
import type { GenericFormData } from "@webiny/form";
import { Bind, Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const PreviewDomain = () => {
    const editor = useDocumentEditor();
    const [isOpen, setIsOpen] = useState(false);

    const { previewDomain, isOverridden, unsetPreviewDomain, setPreviewDomain } =
        usePreviewDomain();

    const commitValue = useCallback((data: GenericFormData) => {
        const value = data.previewDomain;
        if (value.length > 0) {
            setPreviewDomain(value);
        } else {
            unsetPreviewDomain();
        }
        setIsOpen(false);
    }, []);

    const resetDomain = useCallback(() => {
        unsetPreviewDomain();
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!previewDomain) {
            return;
        }

        editor.executeCommand(Commands.RefreshPreview);
    }, [previewDomain]);

    const classNames = cn(
        "absolute left-0 top-0",
        isOverridden ? "fill-accent-default" : "fill-neutral-disabled"
    );

    return (
        <DropdownMenu
            open={isOpen}
            align="center"
            side="bottom"
            className={"shadow-lg"}
            onOpenChange={setIsOpen}
            trigger={
                <IconButton
                    icon={<GlobeIcon />}
                    size="md"
                    onClick={() => {}}
                    variant={"ghost"}
                    className={classNames}
                />
            }
        >
            <div className={"p-sm text-sm"} style={{ width: 300 }}>
                <Form data={{ previewDomain }} onSubmit={commitValue}>
                    {form => (
                        <Bind name={"previewDomain"} validators={[validation.create("url")]}>
                            <Input
                                autoFocus={true}
                                label={"Preview Domain"}
                                description={
                                    <>
                                        Set a custom preview domain for your session.
                                        <br />
                                        This doesn&apos;t affect other users.
                                    </>
                                }
                                size={"md"}
                                onBlur={() => form.submit()}
                                onEnter={() => form.submit()}
                                note={`Hit "Enter" or click outside the menu to apply.`}
                            />
                        </Bind>
                    )}
                </Form>
                {isOverridden ? (
                    <>
                        <Separator variant={"dimmed"} margin={"lg"} />
                        <Button
                            variant={"primary"}
                            onClick={resetDomain}
                            text={"Reset Domain"}
                            size={"sm"}
                        />
                        <Separator variant={"dimmed"} margin={"lg"} />
                        Resetting will revert to using the default preview domain.
                    </>
                ) : null}
            </div>
        </DropdownMenu>
    );
};
