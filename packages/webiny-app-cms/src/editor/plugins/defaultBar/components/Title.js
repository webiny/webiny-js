//@flow
import React from "react";
import { compose, withState, withProps, withHandlers, pure } from "recompose";
import slugify from "slugify";
import { connect } from "webiny-app-cms/editor/redux";
import { Input } from "webiny-ui/Input";
import { updateRevision } from "webiny-app-cms/editor/actions";
import { getPage } from "webiny-app-cms/editor/selectors";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
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

const Title = pure(
    ({
        editTitle,
        enableEdit,
        setTitle,
        title,
        onKeyDown,
        onBlur,
        pageCategory,
        pageLocked,
        pageVersion
    }: Props) => {
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

export default compose(
    connect(
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
    ),
    withState("editTitle", "setEdit", false),
    withState("title", "setTitle", null),
    withProps(({ title, pageTitle }) => ({
        title: title === null ? pageTitle : title
    })),
    withHandlers({
        enableEdit: ({ setEdit }) => () => setEdit(true),
        onBlur: ({
            title,
            pageTitle,
            pageCategoryUrl,
            setEdit,
            setTitle,
            updateRevision
        }) => () => {
            if (title === "") {
                title = "Untitled";
                setTitle(title);
            }
            setEdit(false);
            updateRevision(getRevData({ title, pageTitle, pageCategoryUrl }));
        },
        onKeyDown: ({ title, setTitle, setEdit, pageTitle, pageCategoryUrl, updateRevision }) => (
            e: SyntheticKeyboardEvent<HTMLInputElement>
        ) => {
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
        }
    })
)(Title);
