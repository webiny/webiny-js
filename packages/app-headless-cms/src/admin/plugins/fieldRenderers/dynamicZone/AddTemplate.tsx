import React, { useState } from "react";
import styled from "@emotion/styled";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { Typography } from "@webiny/ui/Typography";
import { CmsDynamicZoneTemplate } from "~/types";
import { TemplateGallery } from "./TemplateGallery";
import { IconButton, ButtonSecondary } from "@webiny/ui/Button";

const AddIconContainer = styled.div`
    text-align: center;
    padding-top: 3px;
`;

const AddButtonContainer = styled.div`
    text-align: center;
    margin-top: 20px;

    :first-of-type {
        margin-top: 0;
    }
`;

const Info = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 5px;

    > svg {
        width: 20px;
        margin-right: 5px;
    }
`;

interface UseAddTemplateParams {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

function useAddTemplate(params: UseAddTemplateParams) {
    const [showGallery, setShowGallery] = useState(false);

    const browseTemplates = () => {
        setShowGallery(true);
    };

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        params.onTemplate(template);
        onGalleryClose();
    };

    const onGalleryClose = () => {
        setShowGallery(false);
    };

    return {
        showGallery,
        browseTemplates,
        onTemplate,
        onGalleryClose
    };
}

interface AddTemplateProps {
    label?: string;
    onTemplate: UseAddTemplateParams["onTemplate"];
}

export const AddTemplateButton = (props: AddTemplateProps) => {
    const { showGallery, onTemplate, browseTemplates, onGalleryClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <AddButtonContainer>
            {showGallery ? (
                <TemplateGallery onTemplate={onTemplate} onClose={onGalleryClose} />
            ) : (
                <>
                    <ButtonSecondary onClick={browseTemplates}>+ Add a template</ButtonSecondary>
                    <Info>
                        <InfoIcon />
                        <Typography use={"caption"}>
                            Click here to learn how templates and dynamic zones work
                        </Typography>
                    </Info>
                </>
            )}
        </AddButtonContainer>
    );
};

export const AddTemplateIcon = (props: AddTemplateProps) => {
    const { showGallery, onTemplate, browseTemplates, onGalleryClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <AddIconContainer>
            {showGallery ? (
                <TemplateGallery onTemplate={onTemplate} onClose={onGalleryClose} />
            ) : (
                <IconButton onClick={browseTemplates} icon={<AddIcon />} />
            )}
        </AddIconContainer>
    );
};
