// @flow
/* eslint-disable */
import React, { useState } from "react";
import { Chips, Chip, ChipText } from "webiny-ui/Chips";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Tags as TagsComponent } from "webiny-ui/Tags";
import { Form } from "webiny-form";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { Link } from "webiny-app/router";
import { css } from "emotion";
import { updateFileBySrc } from "./graphql";
import { compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";
import { graphql } from "react-apollo";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Tags({ refreshFileList, gqlUpdateFileBySrc, showSnackbar, file }) {
    const [editing, setEdit] = useState(false);
    const tags = file.tags || [];

    if (editing) {
        return (
            <Form
                data={{
                    tags
                }}
                onSubmit={async ({ tags }) => {
                    setEdit(false);
                    await gqlUpdateFileBySrc({
                        variables: {
                            src: file.src,
                            data: { tags }
                        }
                    });
                    await refreshFileList();
                    showSnackbar("Tags successfully updated.");
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        <Bind name={"tags"}>
                            <TagsComponent />
                        </Bind>
                        <ButtonSecondary small onClick={() => setEdit(false)}>
                            Cancel
                        </ButtonSecondary>
                        <ButtonPrimary small onClick={submit}>
                            Submit
                        </ButtonPrimary>
                    </>
                )}
            </Form>
        );
    }

    return (
        <>
            {tags.length > 0 ? (
                <Chips>
                    {tags.map(tag => (
                        <Chip key={tag}>
                            <ChipText>{tag}</ChipText>
                        </Chip>
                    ))}
                </Chips>
            ) : (
                <div>No tags assigned.</div>
            )}
            <div className={style.editTag}>
                <Link onClick={() => setEdit(true)}>
                    <EditIcon /> Edit
                </Link>
            </div>
        </>
    );
}

export default compose(
    graphql(updateFileBySrc, { name: "gqlUpdateFileBySrc" }),
    withSnackbar()
)(Tags);
