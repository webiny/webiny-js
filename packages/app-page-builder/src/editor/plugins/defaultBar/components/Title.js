//@flow
import React, { useState, useCallback } from "react";
import slugify from "slugify";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { Input } from "@webiny/ui/Input";
import { updateRevision } from "@webiny/app-page-builder/editor/actions";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
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

type Props = {
    title: string,
    pageCategory: string,
    pageLocked: boolean,
    pageVersion: number,
    updateRevision: ({ title: string, history?: boolean }) => void,
    editTitle: boolean,
    enableEdit: Function,
    setTitle: (title: string) => void,
    onKeyDown: Function,
    onBlur: Function
};

const Title = React.memo(
    ({
        pageTitle,
        pageCategory,
        pageCategoryUrl,
        pageLocked,
        pageVersion,
        updateRevision
    }: Props) => {
        const [editTitle, setEdit] = useState(false);
        const [stateTitle, setTitle] = useState(null);
        let title = stateTitle === null ? pageTitle : stateTitle;
        const enableEdit = useCallback(() => setEdit(true), []);

        const onBlur = useCallback(() => {
            if (title === "") {
                title = "Untitled";
                setTitle(title);
            }
            setEdit(false);
            updateRevision(getRevData({ title, pageTitle, pageCategoryUrl }));
        }, [title]);

        const onKeyDown = useCallback((e: SyntheticKeyboardEvent<HTMLInputElement>) => {
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

                    updateRevision(getRevData({ title, pageTitle, pageCategoryUrl }));
                    break;
                default:
                    return;
            }
        }, [title, pageTitle]);

        return editTitle ? (
            <TitleInputWrapper>
                <Input
                    autoFocus
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
                        <PageTitle onClick={enableEdit}>{title}</PageTitle>
                    </Tooltip>
                    <PageVersion>{`(v${pageVersion})`}</PageVersion>
                </div>
            </TitleWrapper>
        );
    }
);

const getRevData = ({ title, pageTitle, pageCategoryUrl }) => {
    const newData: Object = { title };
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

export default connect(
    state => {
        const { title, version, locked, category } = getPage(state);
        return {
            pageTitle: title,
            pageVersion: version,
            pageLocked: locked,
            pageCategory: category.name,
            pageCategoryUrl: category.url
        };
    },
    { updateRevision }
)(Title);
