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
import { updateFileBySrc, listFiles } from "./../graphql";
import { compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";
import { graphql } from "react-apollo";
import { get } from "lodash";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Tags({ state: parentState, gqlUpdateFileBySrc, showSnackbar, file }) {
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
                        },
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.files.updateFileBySrc.data");
                            const data = cache.readQuery({
                                query: listFiles,
                                variables: parentState.queryParams
                            });

                            data.files.listFiles.data.forEach(item => {
                                if (item.src === newFileData.src) {
                                    item.tags = newFileData.tags;
                                }
                            });

                            cache.writeQuery({
                                query: listFiles,
                                variables: parentState.queryParams,
                                data
                            });
                        }
                    });

                    showSnackbar("Tags successfully updated.");
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        <Bind name={"tags"}>
                            <TagsComponent autoFocus placeholder={"Enter a tag and press enter"} />
                        </Bind>
                        <div style={{ marginTop: "10px" }}>
                            <ButtonPrimary small onClick={submit}>
                                Submit
                            </ButtonPrimary>{" "}
                            <ButtonSecondary small onClick={() => setEdit(false)}>
                                Cancel
                            </ButtonSecondary>
                        </div>
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
                    <EditIcon /> Edit tags
                </Link>
            </div>
        </>
    );
}

export default compose(
    graphql(updateFileBySrc, { name: "gqlUpdateFileBySrc" }),
    withSnackbar()
)(Tags);
