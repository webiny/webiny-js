import React from "react";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_PAGE_SUB } from "../exclusionsCopy.js";
import { EXCLUSIONS_PAGE_TITLE } from "../exclusionsCopy.js";

export interface ExclusionsHeaderProps {
    canAdd: boolean;
    onAdd(): void;
}

// The page title and sub line, always shown; Add exclusion only once a list is loaded (R329).
export const ExclusionsHeader = ({ canAdd, onAdd }: ExclusionsHeaderProps) => {
    let add: React.ReactNode = null;
    if (canAdd) {
        add = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<PersonOffIcon />}
                onClick={() => onAdd()}
            />
        );
    }

    return (
        <div className="flex items-start justify-between gap-md">
            <div className="flex flex-col gap-xs">
                <Heading level={4} as="h1">
                    {EXCLUSIONS_PAGE_TITLE}
                </Heading>
                <Text size="md" className="text-neutral-strong">
                    {EXCLUSIONS_PAGE_SUB}
                </Text>
            </div>
            {add}
        </div>
    );
};
