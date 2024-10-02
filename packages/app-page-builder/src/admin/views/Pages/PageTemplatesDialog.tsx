import React, { useCallback, useState, useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import classNames from "classnames";
import { useQuery } from "@apollo/react-hooks";

import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { ScrollList, ListItem } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Elevation } from "@webiny/ui/Elevation";
import { ButtonSecondary } from "@webiny/ui/Button";

import { ReactComponent as SearchIcon } from "~/editor/assets/icons/search.svg";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { LIST_PAGE_TEMPLATES } from "~/admin/views/PageTemplates/graphql";
import { PagePreview } from "~/admin/plugins/pageDetails/previewContent/PagePreview";
import {
    listItem,
    activeListItem,
    ListItemTitle,
    listStyle,
    TitleContent
} from "./PageTemplatesDialogStyled";
import * as Styled from "~/templateEditor/config/Content/BlocksBrowser/StyledComponents";
import { PbPageTemplate } from "~/types";

const ListContainer = styled.div`
    width: 100%;
    height: calc(100vh - 64px);
    overflow: clip;
    display: flex;
    flex-direction: column;
`;

const DetailsContainer = styled.div`
    height: calc(100% - 10px);
    overflow: hidden;
    position: relative;

    .mdc-tab-bar {
        background-color: var(--mdc-theme-surface);
    }
`;

const RenderBlock = styled.div`
    position: relative;
    z-index: 0;
    background-color: var(--mdc-theme-background);
    height: 100%;
    overflow: auto;
    padding: 25px;
`;

const HeaderTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--mdc-theme-on-background);
    color: var(--mdc-theme-text-primary-on-background);
    background: var(--mdc-theme-surface);
    padding-top: 10px;
    padding-bottom: 9px;
    padding-left: 24px;
    padding-right: 24px;
`;

const PageTemplateTitle = styled.div`
    overflow: hidden;

    span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const HeaderActions = styled.div`
    justify-content: flex-end;
    margin-left: 10px;
    display: flex;
    align-items: center;
`;

const ModalTitleStyled = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--mdc-theme-text-primary-on-background);
`;

const SearchInputWrapper = styled.div`
    padding: 16px;
`;

const BlankTemplateButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 16px;
    padding-bottom: 16px;
    border-top: 1px solid var(--mdc-theme-on-background);
`;

const ModalTitle = () => {
    return (
        <ModalTitleStyled>
            <Typography use="headline5">Pick a template for your new page</Typography>
        </ModalTitleStyled>
    );
};

type PageTemplatesDialogProps = {
    onClose: () => void;
    onSelect: (template?: PbPageTemplate) => Promise<void>;
    isLoading: boolean;
};

const PageTemplatesDialog = ({ onClose, onSelect, isLoading }: PageTemplatesDialogProps) => {
    const [search, setSearch] = useState<string>("");
    const [activeTemplate, setActiveTemplate] = useState<PbPageTemplate | null>();
    const listQuery = useQuery(LIST_PAGE_TEMPLATES) || {};

    const pageTemplatesData: PbPageTemplate[] =
        listQuery?.data?.pageBuilder?.listPageTemplates?.data || [];

    const handleCreatePageFromTemplate = useCallback((template: PbPageTemplate) => {
        onSelect(template);
    }, []);

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            onClose();
        });

        return () => removeKeyHandler("escape");
    }, []);

    const filteredPageTemplates = useMemo(() => {
        if (search) {
            return pageTemplatesData.filter(item => {
                return item.title.toLowerCase().includes(search.toLowerCase());
            });
        }

        return pageTemplatesData;
    }, [search, pageTemplatesData]);

    return (
        <OverlayLayout barLeft={<ModalTitle />} onExited={onClose}>
            <SplitView>
                <LeftPanel span={3}>
                    <ListContainer>
                        <SearchInputWrapper>
                            <Styled.Input>
                                <Icon className={Styled.searchIcon} icon={<SearchIcon />} />
                                <DelayedOnChange value={search} onChange={setSearch}>
                                    {({ value, onChange }) => (
                                        <input
                                            autoFocus
                                            type={"text"}
                                            placeholder="Search templates..."
                                            value={value}
                                            onChange={ev => onChange(ev.target.value)}
                                        />
                                    )}
                                </DelayedOnChange>
                            </Styled.Input>
                        </SearchInputWrapper>
                        <ScrollList
                            className={listStyle}
                            data-testid={"pb-new-page-dialog-templates-list"}
                        >
                            {filteredPageTemplates.map(template => (
                                <ListItem
                                    key={template.id}
                                    className={classNames(
                                        listItem,
                                        activeTemplate?.id === template.id && activeListItem
                                    )}
                                    onClick={() => {
                                        setActiveTemplate(template);
                                    }}
                                >
                                    <TitleContent>
                                        <ListItemTitle>{template.title}</ListItemTitle>
                                        <Typography use={"body2"}>
                                            {template.description}
                                        </Typography>
                                    </TitleContent>
                                </ListItem>
                            ))}
                        </ScrollList>
                        <BlankTemplateButtonWrapper>
                            <ButtonSecondary
                                disabled={isLoading}
                                onClick={() => onSelect()}
                                data-testid={"pb-new-page-dialog-use-blank-template-btn"}
                            >
                                Use a blank page template
                            </ButtonSecondary>
                        </BlankTemplateButtonWrapper>
                    </ListContainer>
                </LeftPanel>
                <RightPanel span={9} data-testid={"pb-new-page-dialog-template-preview"}>
                    {activeTemplate && (
                        <DetailsContainer>
                            <RenderBlock>
                                <Elevation z={2}>
                                    <div style={{ position: "relative" }}>
                                        <HeaderTitle>
                                            <PageTemplateTitle>
                                                <Typography use="headline5">
                                                    {activeTemplate.title}
                                                </Typography>
                                                <Typography use="body2">
                                                    {activeTemplate.description}
                                                </Typography>
                                            </PageTemplateTitle>
                                            <HeaderActions>
                                                <ButtonSecondary
                                                    disabled={isLoading}
                                                    data-testid={
                                                        "pb-new-page-dialog-use-template-btn"
                                                    }
                                                    onClick={() =>
                                                        handleCreatePageFromTemplate(activeTemplate)
                                                    }
                                                >
                                                    Use Template
                                                </ButtonSecondary>
                                            </HeaderActions>
                                        </HeaderTitle>
                                        <PagePreview page={activeTemplate} />
                                    </div>
                                </Elevation>
                            </RenderBlock>
                        </DetailsContainer>
                    )}
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default PageTemplatesDialog;
