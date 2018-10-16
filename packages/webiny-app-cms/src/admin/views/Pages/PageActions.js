import React from "react";
import { compose } from "recompose";
import { css } from "emotion";
import { withRouter } from "webiny-app/components";
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

const PageActions = ({ revision, router }) => {
    return (
        <Grid className={listHeader}>
            <Cell span={6}>
                <Typography use="headline5">{revision.title}</Typography>
            </Cell>
            <Cell span={6}>
                {/* Revision selector */}
                <Select
                    value={revision.id}
                    onChange={item => console.log(item)}
                    className={smallSelect}
                >
                    {revision.page.revisions.map(({ id, name }) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </Select>
                {/* Publish */}
                <Tooltip content={"Publish"} placement={"top"}>
                    <IconButton
                        icon={<PublishIcon />}
                        onClick={() => console.log("publish")}
                    />
                </Tooltip>
                {/* Edit */}
                <Tooltip content={"Edit"} placement={"top"}>
                    <IconButton
                        icon={<EditIcon />}
                        onClick={() =>
                            router.goToRoute({
                                name: "Cms.Editor",
                                params: { page: revision.page.id, revision: revision.id },
                            })
                        }
                    />
                </Tooltip>
                {/* Delete */}
                <Tooltip content={"Delete"} placement={"top"}>
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => console.log("delete")}
                    />
                </Tooltip>
            </Cell>
        </Grid>
    );
};

export default compose(
    withRouter()
)(PageActions);