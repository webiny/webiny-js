// @flow
import React from "react";
import { compose } from "recompose";
import { css } from "emotion";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as PublishIcon } from "webiny-app-cms/admin/assets/visibility.svg";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/admin/assets/delete.svg";
import { ReactComponent as EditIcon } from "webiny-app-cms/admin/assets/edit.svg";
import { Tooltip } from "webiny-ui/Tooltip";

const listHeader = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

const smallSelect = css({
    maxWidth: 200
});

type Props = WithRouterProps & WithPageDetailsProps;

const PageActions = ({ pageDetails: { revision, revisions, pageId }, router }: Props) => {
    return (
        <Grid className={listHeader}>
            <Cell span={6}>
                <Typography use="headline5">{revision.data.title}</Typography>
            </Cell>
            <Cell span={6}>
                {/* Revision selector */}
                <Select
                    value={revision.data.id}
                    onChange={id => router.goToRoute({ params: { revision: id }, merge: true })}
                    className={smallSelect}
                >
                    {revisions.data.map(({ id, name }) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </Select>
                {/* Publish */}
                <Tooltip content={"Publish"} placement={"top"}>
                    <IconButton icon={<PublishIcon />} onClick={() => console.log("publish")} />
                </Tooltip>
                {/* Edit */}
                <Tooltip content={"Edit"} placement={"top"}>
                    <IconButton
                        icon={<EditIcon />}
                        onClick={() =>
                            router.goToRoute({
                                name: "Cms.Editor",
                                params: { page: pageId, revision: revision.id }
                            })
                        }
                    />
                </Tooltip>
                {/* Delete */}
                <Tooltip content={"Delete"} placement={"top"}>
                    <IconButton icon={<DeleteIcon />} onClick={() => console.log("delete")} />
                </Tooltip>
            </Cell>
        </Grid>
    );
};

export default withRouter()(PageActions);
