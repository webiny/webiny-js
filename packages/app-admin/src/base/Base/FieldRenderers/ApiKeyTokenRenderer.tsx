import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Alert, CopyButton, Label, useToast } from "@webiny/admin-ui";

export const ApiKeyTokenRenderer = createFieldRenderer(({ field }) => {
    const toast = useToast();
    const token = field.value as string | undefined;

    return (
        <div>
            <Label text={field.label || "Token"} />
            {token ? (
                <div
                    className={
                        "py-sm pl-sm-extra pr-xs rounded-md mt-xs bg-neutral-disabled flex justify-between items-center"
                    }
                >
                    <div>{token}</div>
                    <CopyButton
                        variant={"ghost"}
                        value={token}
                        onCopy={() => {
                            toast.showSuccessToast({ title: "Successfully copied!" });
                        }}
                    />
                </div>
            ) : (
                <Alert className={"mt-xs"}>
                    {"Your token will be shown once you submit the form."}
                </Alert>
            )}
        </div>
    );
});
