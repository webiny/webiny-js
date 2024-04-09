import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Link } from "@webiny/react-router";
import { createNewEntryUrl } from "./createEntryUrl";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const missingEntryLabel = t`If you can't find the intended reference value in the target model,
         please close this dialog and populate the {newEntryLink} in the target model first.`;

const referenceMultipleModelsLabel = t`The creation of reference values from within this view is only supported
 when a single reference model is selected. To reference values from multiple models,
 please make sure the referenced values exist before setting the reference.`;

const HelpTextTypography = styled(Typography)`
    & {
        display: inline-block;
        color: var(--mdc-theme-text-secondary-on-background) !important;
    }
`;

export const ReferenceMultipleModelsHelpText = () => {
    return <HelpTextTypography use={"caption"}>{referenceMultipleModelsLabel}</HelpTextTypography>;
};

interface MissingEntryHelpTextProps {
    refModelId: string;
}
const MissingEntryHelpText = ({ refModelId }: MissingEntryHelpTextProps) => {
    return (
        <HelpTextTypography use={"caption"}>
            {missingEntryLabel({
                newEntryLink: (
                    <Link to={createNewEntryUrl(refModelId)} target={"_blank"}>{t`entry`}</Link>
                )
            })}
        </HelpTextTypography>
    );
};

export default MissingEntryHelpText;
