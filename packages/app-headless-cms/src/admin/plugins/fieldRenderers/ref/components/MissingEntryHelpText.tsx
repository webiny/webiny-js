import React from "react";
import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";
import { SimpleLink } from "@webiny/app-admin";
import { createNewEntryUrl } from "./createEntryUrl.js";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const missingEntryLabel = t`If you can't find the intended reference value in the target model,
         please close this dialog and populate the {newEntryLink} in the target model first.`;

const referenceMultipleModelsLabel = t`The creation of reference values from within this view is only supported
 when a single reference model is selected. To reference values from multiple models,
 please make sure the referenced values exist before setting the reference.`;

const HelpTextTypography = styled(Text)`
    & {
        display: inline-block;
        color: var(--mdc-theme-text-secondary-on-background) !important;
    }
`;

export const ReferenceMultipleModelsHelpText = () => {
    return <HelpTextTypography>{referenceMultipleModelsLabel}</HelpTextTypography>;
};

interface MissingEntryHelpTextProps {
    refModelId: string;
}
const MissingEntryHelpText = ({ refModelId }: MissingEntryHelpTextProps) => {
    return (
        <HelpTextTypography>
            {missingEntryLabel({
                newEntryLink: (
                    <SimpleLink
                        to={createNewEntryUrl(refModelId)}
                        target={"_blank"}
                    >{t`entry`}</SimpleLink>
                )
            })}
        </HelpTextTypography>
    );
};

export default MissingEntryHelpText;
