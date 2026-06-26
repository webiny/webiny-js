import React from "react";
import { Text } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { NoEntriesIllustration } from "./NoEntriesIllustration.js";

const t = i18n.ns("app-workflows/components/workflow-states-widget/empty");

export const WorkflowStateListEmpty = () => {
    return (
        <div
            className={
                "w-full min-h-[194px] flex flex-col items-center justify-center gap-md py-xl"
            }
        >
            <NoEntriesIllustration />
            <Text
                size={"sm"}
                as={"div"}
                className={"text-center text-neutral-strong"}
                style={{ maxWidth: 325 }}
            >
                {t`There are no entries available.`}
            </Text>
        </div>
    );
};
