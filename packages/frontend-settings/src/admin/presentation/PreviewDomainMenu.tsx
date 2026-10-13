import React, { useCallback, useState } from "react";
import { ReactComponent as GlobeIcon } from "@webiny/icons/language.svg";
import {
    Button,
    DropdownMenu,
    IconButton,
    Input,
    Separator,
    Text,
    Tooltip,
    cn
} from "@webiny/admin-ui";
import { usePreviewDomain } from "~/admin/usePreviewDomain.js";

const isValidUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

interface PreviewDomainMenuProps {
    className?: string;
}

/**
 * Globe button with a menu to set or reset the current user's preview domain override.
 */
export const PreviewDomainMenu = ({ className }: PreviewDomainMenuProps) => {
    const { previewDomain, isOverridden, setPreviewDomain, unsetPreviewDomain } =
        usePreviewDomain();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState(previewDomain);
    const [invalid, setInvalid] = useState(false);

    const onOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setValue(previewDomain);
                setInvalid(false);
            }
            setIsOpen(open);
        },
        [previewDomain]
    );

    const commitValue = useCallback(() => {
        const domain = value.trim();
        if (!domain) {
            unsetPreviewDomain();
        } else if (isValidUrl(domain)) {
            setPreviewDomain(domain);
        } else {
            setInvalid(true);
            return;
        }
        setIsOpen(false);
    }, [value]);

    const resetDomain = useCallback(() => {
        unsetPreviewDomain();
        setIsOpen(false);
    }, []);

    return (
        <DropdownMenu
            open={isOpen}
            align="center"
            side="bottom"
            className={"shadow-lg"}
            onOpenChange={onOpenChange}
            trigger={
                // `className` positions the button (callers overlay it on the address bar), so it
                // goes on this wrapper rather than the button. That way the Tooltip trigger keeps a
                // non-zero box to anchor to.
                <span className={className}>
                    <Tooltip
                        content={<Text size="md">Change preview domain</Text>}
                        side="bottom"
                        trigger={
                            <IconButton
                                icon={<GlobeIcon />}
                                size="md"
                                variant={"ghost"}
                                className={cn(isOverridden ? "fill-accent-default" : "")}
                            />
                        }
                    />
                </span>
            }
        >
            <div className={"p-sm text-sm"} style={{ width: 300 }}>
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
                    value={value}
                    onChange={value => {
                        setValue(value);
                        setInvalid(false);
                    }}
                    onBlur={commitValue}
                    onEnter={commitValue}
                    validation={
                        invalid
                            ? { isValid: false, message: "Value must be a valid URL." }
                            : undefined
                    }
                    note={`Hit "Enter" or click outside the menu to apply.`}
                />
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
