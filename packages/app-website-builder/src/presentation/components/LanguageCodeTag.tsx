import React from "react";
import { Tag } from "@webiny/admin-ui";
import { useFeatureFlags } from "@webiny/app-admin";

export interface LanguageCodeProps {
    code: string | undefined;
    className?: string;
}

export const LanguageCodeTag = ({ code, className }: LanguageCodeProps) => {
    const featureFlags = useFeatureFlags();

    if (!code || !featureFlags.isMultiTenancyEnabled()) {
        return null;
    }

    return (
        <div className={"flex justify-center items-center"}>
            <Tag variant={"neutral-muted"} content={code} className={className} />
        </div>
    );
};
