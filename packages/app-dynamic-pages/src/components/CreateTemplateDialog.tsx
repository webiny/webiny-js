import React, { useState } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { Icon } from "@webiny/ui/Icon";
import { ButtonDefault } from "@webiny/ui/Button";
import { List, ListItem } from "@webiny/ui/List";
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogCancel } from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { useModels } from "@webiny/app-headless-cms";
import { CmsModel } from "@webiny/app-headless-cms/types";

import { ReactComponent as ArrowRightIcon } from "@material-design-icons/svg/round/keyboard_arrow_right.svg";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as ArticleIcon } from "@material-symbols/svg-400/rounded/article.svg";
import { ReactComponent as DatabaseIcon } from "@material-symbols/svg-400/rounded/database.svg";

const dialogStyles = css`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }

    .mdc-dialog__content {
        padding-top: 0 !important;
    }

    .content-wrapper:focus-visible {
        outline: none;
    }
`;

const Info = styled.div`
    display: flex;
    align-items: center;
    padding: 12px;
    margin-top: 12px;
    background: var(--mdc-theme-background);
    color: var(--mdc-theme-text-secondary-on-background);
    fill: var(--mdc-theme-text-secondary-on-background);
    cursor: pointer;

    & svg {
        margin-right: 12px;
    }
`;

const ListItemStyled = styled(ListItem)`
    padding-top: 8px;
    padding-bottom: 8px;
    height: auto;
    min-height: 64px;
    color: var(--mdc-theme-text-secondary-on-background);
    fill: var(--mdc-theme-text-secondary-on-background);

    & svg {
        flex-shrink: 0;
    }

    .arrow-right {
        margin-left: auto;
    }
`;

const ListItemContent = styled.div`
    display: grid;
    padding-left: 21px;
    padding-right: 21px;
`;

const Title = styled.div`
    font-size: 20px;
`;

const Highlight = styled.div`
    color: var(--mdc-theme-primary);
`;

const DynamicTemplatesInfo = styled.div`
    padding: 24px;
    font-size: 20px;
    line-height: 24px;
    color: var(--mdc-theme-text-secondary-on-background);
`;

const leftButton = css`
    margin-right: auto;
`;

interface ModelIconProps {
    model: CmsModel;
}
const ModelIcon: React.FC<ModelIconProps> = ({ model }) => {
    return (
        <FontAwesomeIcon
            style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
            icon={(model.icon || "fas/star").split("/") as IconProp}
            width={32}
            size={"2x"}
        />
    );
};

type HeadlessPageTemplateItemProps = {
    icon: React.ReactElement<any>;
    name: string;
    description?: string;
    highlight?: string;
    onClick: () => void;
    hasNestedFields?: boolean;
};

const HeadlessPageTemplateItem: React.FC<HeadlessPageTemplateItemProps> = ({
    icon,
    name,
    description,
    highlight,
    onClick,
    hasNestedFields
}) => {
    return (
        <ListItemStyled onClick={onClick}>
            <Icon icon={icon} />
            <ListItemContent>
                <Title>{name}</Title>
                {description}
                <Highlight>{highlight}</Highlight>
            </ListItemContent>
            {hasNestedFields && <ArrowRightIcon className="arrow-right" />}
        </ListItemStyled>
    );
};

type CreateTemplateDialogProps = {
    onClose: () => void;
    onSelect: (model: CmsModel) => void;
    onStaticTemplateSelect: () => void;
    existingDynamicTemplateModelIds: string[];
};

export const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
    onClose,
    onSelect,
    onStaticTemplateSelect,
    existingDynamicTemplateModelIds
}) => {
    const [dynamicTemplateSelect, setDynamicTemplateSelect] = useState(false);
    const { models, loading } = useModels();

    return (
        <Dialog open={true} className={dialogStyles} onClose={onClose}>
            <DialogTitle>What type of a template you wish to create?</DialogTitle>
            <DynamicTemplatesInfo>
                Select a Headless Page Template for which you want to create a dynamic page
                template:
            </DynamicTemplatesInfo>
            <DialogContent>
                <div className="content-wrapper" tabIndex={0}>
                    {dynamicTemplateSelect ? (
                        <>
                            {loading && <CircularProgress />}
                            <List>
                                {models.map((model, index) => (
                                    <HeadlessPageTemplateItem
                                        key={index}
                                        icon={<ModelIcon model={model} />}
                                        name={model.name}
                                        description={model.description}
                                        highlight={
                                            existingDynamicTemplateModelIds.some(
                                                id => id === model.modelId
                                            )
                                                ? "Template already exists, click to edit."
                                                : undefined
                                        }
                                        onClick={() => onSelect(model)}
                                    />
                                ))}
                            </List>
                        </>
                    ) : (
                        <>
                            <HeadlessPageTemplateItem
                                icon={<ArticleIcon width={36} height={36} />}
                                name={"Static template"}
                                description={"Used for creating new Page Builder pages."}
                                onClick={onStaticTemplateSelect}
                            />
                            <HeadlessPageTemplateItem
                                icon={<DatabaseIcon width={36} height={36} />}
                                name={"Dynamic template"}
                                description={
                                    "Used for auto-generating pages  from Headless CMS entries."
                                }
                                onClick={() => setDynamicTemplateSelect(true)}
                                hasNestedFields
                            />
                            <Info>
                                <InfoIcon />
                                Click here to learn about different template types.
                            </Info>
                        </>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                {dynamicTemplateSelect && (
                    <ButtonDefault
                        onClick={() => {
                            setDynamicTemplateSelect(false);
                        }}
                        className={leftButton}
                    >
                        &lt; Go back
                    </ButtonDefault>
                )}
                <DialogCancel onClick={onClose}>Cancel</DialogCancel>
            </DialogActions>
        </Dialog>
    );
};
