import * as React from "react";
import type { SingleImageUploadProps } from "@webiny/app-admin";
import { SingleImageUpload } from "@webiny/app-admin";
import { AvatarImagePreview } from "./AvatarImagePreview.js";
import { AvatarImageTrigger } from "~/ui/components/AvatarImage/AvatarImageTrigger.js";
import { cn } from "@webiny/admin-ui";

export const AvatarImage = ({ round, ...props }: SingleImageUploadProps) => {
    return (
        <div className={"w-full flex-1"}>
            <div
                className={cn([
                    "size-[128px] mx-auto relative overflow-hidden",
                    round && "rounded-full"
                ])}
            >
                <SingleImageUpload
                    {...props}
                    className={"p-0 !border-none"}
                    variant={"ghost"}
                    type={"area"}
                    renderFilePreview={({ onReplaceItem, onRemoveItem, value, disabled }) => {
                        return (
                            <AvatarImagePreview
                                onReplaceItem={onReplaceItem}
                                onRemoveItem={onRemoveItem}
                                value={value}
                                disabled={disabled}
                            />
                        );
                    }}
                    renderTrigger={({ onSelectItem, disabled }) => {
                        return (
                            <AvatarImageTrigger disabled={disabled} onSelectItem={onSelectItem} />
                        );
                    }}
                />
            </div>
        </div>
    );
};
