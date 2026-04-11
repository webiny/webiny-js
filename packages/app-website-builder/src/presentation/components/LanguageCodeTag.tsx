import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Wcp } from "@webiny/app-admin";

export interface LanguageCodeProps {
    code: string | undefined;
    className?: string;
}

export const LanguageCodeTag = ({ code, className }: LanguageCodeProps) => {
    if (!code) {
        return null;
    }

    return (
        <Wcp.CanUseMultiTenancy>
            <div className={"flex justify-center items-center"}>
                <Tag variant={"neutral-muted"} content={code} className={className} />
            </div>
        </Wcp.CanUseMultiTenancy>
    );
};
