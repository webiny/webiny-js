import React, { useState } from "react";
import styled from "@emotion/styled";
import get from "lodash/get";
import { validation } from "@webiny/validation";
import { Form } from "@webiny/form";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { IconButton as UiIconButton } from "@webiny/ui/Button";
import { ReactComponent as AttachFileIcon } from "~/admin/assets/icons/attach_file_24dp.svg";
import { ReactComponent as SendIcon } from "~/admin/assets/icons/send_24dp.svg";
import { useComment } from "~/admin/hooks/useComment";
import { useCurrentChangeRequestId } from "~/admin/hooks/useCurrentChangeRequestId";
import { Box, Columns } from "~/admin/components/Layout";

const CommentBoxColumns = styled(Columns)`
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

const IconButton = styled(UiIconButton)<{ rotate?: string; fill?: string }>`
    svg {
        transform: rotate(${props => (props.rotate ? props.rotate : 0)});
        fill: ${props => (props.fill ? props.fill : "currentColor")};
    }
`;

const InputBox = styled(Box)`
    flex: 1 1 100%;
`;

export const CommentBox = () => {
    const { createComment } = useComment();
    const changeRequestId = useCurrentChangeRequestId();
    const [commentBoxKey, setCommentBoxKey] = useState<string>("");

    return (
        <Form
            key={commentBoxKey}
            onSubmit={async formData => {
                const data = {
                    ...formData,
                    changeRequest: changeRequestId
                };
                const response = await createComment({ variables: { data } });
                /*
                 * After submitting comment we're using the "id" state to re-mount entire Form component,
                 * so that we have a clean slate for "RichTextEditor" for new comment.
                 */
                setCommentBoxKey(get(response, "data.apw.comment.data.id"));
            }}
        >
            {({ Bind, submit }) => (
                <CommentBoxColumns space={2} alignItems={"center"} paddingX={6}>
                    <Box>
                        <IconButton icon={<AttachFileIcon />} rotate={"45deg"} />
                    </Box>

                    <InputBox style={{ flex: "1 1 100%" }}>
                        <Bind name={"body"} validators={validation.create("required,minLength:1")}>
                            <RichTextEditor placeholder={`Type something to send...`} />
                        </Bind>
                    </InputBox>
                    <Box>
                        <IconButton
                            icon={<SendIcon />}
                            fill={"var(--mdc-theme-secondary)"}
                            onClick={submit}
                        />
                    </Box>
                </CommentBoxColumns>
            )}
        </Form>
    );
};
