import React from "react";
import styled from "@emotion/styled";
import { makeDecoratable } from "@webiny/app-admin";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary } from "@webiny/ui/Button";
import { CmsDynamicZoneTemplate } from "~/types";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon";

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 170px;
    height: 200px;
    margin: 5px;
    border: 1px solid var(--mdc-theme-background);
`;

const CardIcon = styled.div`
    text-align: center;
    padding: 25px;
    font-size: 1.5rem;
    background-color: var(--mdc-theme-background);
`;

const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
    text-align: left;
`;

const CardTitle = styled(Typography)`
    margin-bottom: 10px;
`;

const CardDescription = styled(Typography)`
    text-overflow: ellipsis;
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
`;

const CardButton = styled(ButtonSecondary)`
    font-size: 0.7rem;
    line-height: 100%;
    margin-top: auto;
`;

export interface TemplateCardProps {
    template: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateItem = makeDecoratable(
    "TemplateItem",
    ({ template, onTemplate }: TemplateCardProps) => {
        return (
            <CardContainer>
                <CardIcon>
                    <TemplateIcon icon={template.icon} />
                </CardIcon>
                <CardBody>
                    <CardTitle tag={"p"} use={"subtitle2"}>
                        {template.name}
                    </CardTitle>
                    <CardDescription tag={"p"} use={"body2"}>
                        {template.description}
                    </CardDescription>
                    <CardButton onClick={() => onTemplate(template)}>+ Insert Template</CardButton>
                </CardBody>
            </CardContainer>
        );
    }
);
