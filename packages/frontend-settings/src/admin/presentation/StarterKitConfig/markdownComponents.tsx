import React, { useCallback, useRef } from "react";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { IconButton, useToast } from "@webiny/admin-ui";

export const markdownComponents = {
    pre: ({ children }: { children: React.ReactNode }) => {
        const codeRef = useRef<HTMLPreElement | null>(null);
        const toast = useToast();

        const copyToClipboard = useCallback(() => {
            const codeElement = codeRef.current?.querySelector("code");
            if (!codeElement) {
                return;
            }

            navigator.clipboard.writeText(codeElement.innerText);
            toast.showSuccessToast({ title: "Copied to clipboard!" });
        }, []);

        return (
            <pre
                className={"p-md bg-neutral-dimmed rounded mt-2 relative"}
                ref={element => {
                    codeRef.current = element;
                }}
            >
                <IconButton
                    variant={"secondary"}
                    icon={<CopyIcon />}
                    className={"absolute right-[10px] top-[10px] cursor-pointer"}
                    onClick={copyToClipboard}
                />
                {children}
            </pre>
        );
    }
};
