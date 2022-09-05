import React, { useState, useCallback, SyntheticEvent } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { createComponentPlugin } from "@webiny/app-admin";
import {
    PageMeta,
    PageTitle,
    pageTitleWrapper,
    PageVersion,
    TitleInputWrapper,
    TitleWrapper
} from "./Styled";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { usePage } from "~/pageEditor/hooks/usePage";
import { PageAtomType } from "~/pageEditor/state";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { EditorBar } from "~/editor";

declare global {
    interface Window {
        Cypress: any;
    }
}

interface PageInfo {
    pageTitle: string;
    pageVersion: number;
    pageLocked: boolean;
    pageCategory?: string;
    pageCategoryUrl?: string;
}
const extractPageInfo = (page: PageAtomType): PageInfo => {
    const { title, version, locked, category } = page;
    return {
        pageTitle: title as string,
        pageVersion: version,
        pageLocked: locked,
        pageCategory: category?.name,
        pageCategoryUrl: category?.url
    };
};

const Title: React.FC = () => {
    const handler = useEventActionHandler();
    const [page] = usePage();
    const { showSnackbar } = useSnackbar();
    const { pageTitle, pageVersion, pageLocked, pageCategory } = extractPageInfo(page);
    const [editTitle, setEdit] = useState<boolean>(false);
    const [stateTitle, setTitle] = useState<string | null>(null);
    let title = stateTitle === null ? pageTitle : stateTitle;

    const updatePage = (data: Partial<PageAtomType>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data,
                onFinish: () => {
                    showSnackbar(`Page title updated successfully!`);
                }
            })
        );
    };

    const enableEdit = useCallback(() => setEdit(true), []);

    const onBlur = useCallback(() => {
        if (title === "") {
            title = "Untitled";
            setTitle(title);
        }
        setEdit(false);
        updatePage({ title });
    }, [title]);

    const onKeyDown = useCallback(
        (e: SyntheticEvent) => {
            // @ts-ignore
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setEdit(false);
                    setTitle(pageTitle);
                    break;
                case "Enter":
                    if (title === "") {
                        title = "Untitled";
                        setTitle(title);
                    }

                    e.preventDefault();
                    setEdit(false);

                    updatePage({ title });
                    break;
                default:
                    return;
            }
        },
        [title, pageTitle]
    );

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    return editTitle ? (
        <TitleInputWrapper>
            <Input
                autoFocus={autoFocus}
                fullwidth
                value={title}
                onChange={setTitle}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
            />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper>
            <PageMeta>
                <Typography use={"overline"}>
                    {`${pageCategory} (status: ${pageLocked ? "published" : "draft"})`}
                </Typography>
            </PageMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={pageTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <PageTitle data-testid="pb-editor-page-title" onClick={enableEdit}>
                        {title}
                    </PageTitle>
                </Tooltip>
                <PageVersion>{`(v${pageVersion})`}</PageVersion>
            </div>
        </TitleWrapper>
    );
};

export const TitlePlugin = createComponentPlugin(EditorBar.LeftSection, LeftSection => {
    return function AddTitle(props) {
        return (
            <LeftSection>
                {props.children}
                <Title />
            </LeftSection>
        );
    };
});
