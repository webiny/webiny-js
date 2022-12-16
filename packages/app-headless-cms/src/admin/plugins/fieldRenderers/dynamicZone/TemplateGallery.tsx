import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/highlight_off.svg";
import { IconButton } from "@webiny/ui/Button";
import { CmsDynamicZoneTemplate } from "~/types";
import { useModelField } from "~/admin/hooks";
import { TemplateCard } from "./TemplateCard";

const GalleryContainer = styled.div``;

const GalleryCards = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px;
`;

interface TemplateGalleryProps {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
    onClose: () => void;
}

export const TemplateGallery = ({ onTemplate, onClose }: TemplateGalleryProps) => {
    const { field } = useModelField();
    const templates = field.settings?.templates || [];

    return (
        <GalleryContainer>
            <GalleryCards>
                {templates.map(template => (
                    <TemplateCard key={template.id} template={template} onTemplate={onTemplate} />
                ))}
            </GalleryCards>
            <IconButton onClick={onClose} icon={<CloseIcon />} />
        </GalleryContainer>
    );
};
