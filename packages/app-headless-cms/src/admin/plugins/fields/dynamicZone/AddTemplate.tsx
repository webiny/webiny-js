import React, { useState } from "react";
import styled from "@emotion/styled";
import { CmsDynamicZoneTemplate } from "~/types";
import { ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { TemplateDialog } from "./TemplateDialog";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { Elevation } from "@webiny/ui/Elevation";

const AddTemplateButtonContainer = styled(Elevation)`
    padding: 25px 0 20px;
    text-align: center;
`;

/**
 * This hacking is needed to position the button exactly in the middle of available area and not stretch the parent element.
 */
const AddTemplateIconContainer = styled.div`
    text-align: center;
    height: 36px;

    > button {
        margin-left: -24px;
        position: absolute;
    }
`;

const Info = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: center;
    align-items: center;

    > svg {
        width: 20px;
        margin-right: 5px;
    }
`;

interface AddTemplateProps {
    onTemplate: UseAddTemplateParams["onTemplate"];
}

interface UseAddTemplateParams {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

function useAddTemplate(params: UseAddTemplateParams) {
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    const addTemplate = () => {
        setShowTemplateDialog(true);
    };

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        params.onTemplate(template);
    };

    const onDialogClose = () => {
        setShowTemplateDialog(false);
    };

    return {
        addTemplate,
        onTemplate,
        onDialogClose,
        showTemplateDialog
    };
}

export const AddTemplateButton = (props: AddTemplateProps) => {
    const { addTemplate, onTemplate, showTemplateDialog, onDialogClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <AddTemplateButtonContainer z={2}>
            {showTemplateDialog ? (
                <TemplateDialog onTemplate={onTemplate} onClose={onDialogClose} />
            ) : null}
            <ButtonSecondary onClick={addTemplate}>+ Add a template</ButtonSecondary>
            <Info>
                <InfoIcon />
                <Typography use={"caption"}>
                    Click here to learn how templates and dynamic zones work
                </Typography>
            </Info>
        </AddTemplateButtonContainer>
    );
};

export const AddTemplateIcon = (props: AddTemplateProps) => {
    const { addTemplate, onTemplate, showTemplateDialog, onDialogClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <AddTemplateIconContainer>
            {showTemplateDialog ? (
                <TemplateDialog onTemplate={onTemplate} onClose={onDialogClose} />
            ) : null}
            <IconButton onClick={addTemplate} icon={<AddIcon />} />
        </AddTemplateIconContainer>
    );
};
