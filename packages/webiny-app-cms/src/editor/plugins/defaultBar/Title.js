//@flow
import React from "react";
import { compose, withState, withProps, withHandlers } from "recompose";
import { get } from "dot-prop-immutable";
import { connect } from "react-redux";
import { Input } from "webiny-ui/Input";
import { updateRevision } from "./actions";
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
    page: Object,
    title: string,
    page: Object,
    updateRevision: ({ title: string, history?: boolean }) => void,
    editTitle: boolean,
    enableEdit: Function,
    setTitle: (title: string) => void,
    onKeyDown: Function,
    onBlur: Function
};

const Title = ({
    page,
    updateRevision,
    editTitle,
    enableEdit,
    setTitle,
    title,
    onKeyDown,
    onBlur
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
                    {get(page, "category.name") || ""} (status:{" "}
                    {page.locked ? "published" : "draft"})
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
                <PageVersion>{`(v${page.version})`}</PageVersion>
            </div>
        </TitleWrapper>
    );
};

export default compose(
    connect(
        state => ({ page: getPage(state) }),
        { updateRevision }
    ),
    withState("editTitle", "setEdit", false),
    withState("title", "setTitle", null),
    withProps(({ title, page }) => ({
        title: title === null ? page.title : title
    })),
    withHandlers({
        enableEdit: ({ setEdit }) => () => setEdit(true),
        onBlur: ({ title, setEdit, setTitle, updateRevision }) => () => {
            if (title === "") {
                title = "Untitled";
                setTitle(title);
            }
            setEdit(false);
            updateRevision({ title });
        },
        onKeyDown: ({ title, setTitle, setEdit, page, updateRevision }) => (
            e: SyntheticKeyboardEvent<HTMLInputElement>
        ) => {
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setEdit(false);
                    setTitle(page.title);
                    break;
                case "Enter":
                    if (title === "") {
                        title = "Untitled";
                        setTitle(title);
                    }

                    e.preventDefault();
                    setEdit(false);
                    updateRevision({ title });
                    break;
                default:
                    return;
            }
        }
    })
)(Title);
