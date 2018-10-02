//@flow
import React from "react";
import { compose, withState } from "recompose";
import { get } from "dot-prop-immutable";
import { connect } from "react-redux";
import { Input } from "webiny-ui/Input";
import { updateRevision } from "./actions";
import { getPage, getRevision } from "webiny-app-cms/editor/selectors";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
import { ReactComponent as CloseIcon } from "webiny-app-cms/editor/assets/icons/close.svg";
import { IconButton } from "webiny-ui/Button";
import {
    PageMeta,
    PageTitle,
    pageTitleWrapper,
    PageVersion,
    resetBtn,
    TitleInputWrapper,
    TitleWrapper
} from "./Styled";

type Props = {
    page: Object,
    revision: Object,
    updateRevision: ({ title: string, history?: boolean }) => void,
    editTitle: boolean,
    setEdit: (flag: boolean) => void
};

const Title = ({ revision, page, updateRevision, editTitle, setEdit }: Props) => {
    return editTitle ? (
        <TitleInputWrapper>
            <Input
                autoFocus
                fullwidth
                value={revision.title}
                onChange={title => updateRevision({ title, history: false })}
                onBlur={() => {
                    setEdit(false);
                    updateRevision({ title: revision.title });
                }}
            />
            <IconButton className={resetBtn} onClick={() => setEdit(false)} icon={<CloseIcon />} />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper>
            <PageMeta>
                <Typography use={"overline"}>
                    {get(page, "category.name") || ""} (status:{" "}
                    {revision.locked ? "published" : "draft"})
                </Typography>
            </PageMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={pageTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <PageTitle onClick={() => setEdit(true)}>
                        {revision.title || "Untitled"}
                    </PageTitle>
                </Tooltip>
                <PageVersion>({revision.name})</PageVersion>
            </div>
        </TitleWrapper>
    );
};

export default compose(
    connect(
        state => ({ page: getPage(state), revision: getRevision(state) }),
        { updateRevision }
    ),
    withState("editTitle", "setEdit", false)
)(Title);
