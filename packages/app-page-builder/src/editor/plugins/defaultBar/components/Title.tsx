import React, { useState, useCallback, SyntheticEvent } from "react";
import slugify from "slugify";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdatePageRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { pageAtom, PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { useApolloClient } from "react-apollo";
import { useRecoilValue } from "recoil";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import {
    PageMeta,
    PageTitle,
    pageTitleWrapper,
    PageVersion,
    TitleInputWrapper,
    TitleWrapper
} from "./Styled";

declare global {
    interface Window {
        Cypress: any;
    }
}

const extractPageInfo = (page: PageAtomType): any => {
    const { title, version, locked, category } = page;
    return {
        pageTitle: title,
        pageVersion: version,
        pageLocked: locked,
        pageCategory: category.name,
        pageCategoryUrl: category.url
    };
};

const Title: React.FunctionComponent = () => {
    const handler = useEventActionHandler();
    const page = useRecoilValue(pageAtom);
    const apolloClient = useApolloClient();
    const { pageTitle, pageVersion, pageLocked, pageCategory, pageCategoryUrl } = extractPageInfo(
        page
    );
    const [editTitle, setEdit] = useState<boolean>(false);
    const [stateTitle, setTitle] = useState<string>(null);
    let title = stateTitle === null ? pageTitle : stateTitle;

    const updateRevision = ({ title, pageTitle, pageCategoryUrl }) => {
        handler.trigger(
            new UpdatePageRevisionActionEvent({
                page: getRevData({ title, pageTitle, pageCategoryUrl }) as any,
                client: apolloClient
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
        updateRevision({ title, pageTitle, pageCategoryUrl });
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

                    updateRevision({ title, pageTitle, pageCategoryUrl });
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

const getRevData = ({ title, pageTitle, pageCategoryUrl }) => {
    const newData: { title: string; url?: string } = { title };
    if (pageTitle === "Untitled") {
        newData.url =
            pageCategoryUrl +
            slugify(title, {
                replacement: "-",
                lower: true,
                remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
            });
    }

    return newData;
};

export default React.memo(Title);
