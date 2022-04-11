import React, { useState } from "react";
import styled from "@emotion/styled";
import { css, cx } from "emotion";
import get from "lodash/get";
import { validation } from "@webiny/validation";
import { Form } from "@webiny/form";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { IconButton as UiIconButton } from "@webiny/ui/Button";
import { ReactComponent as AttachFileIcon } from "~/assets/icons/attach_file_24dp.svg";
import { ReactComponent as SendIcon } from "~/assets/icons/send_24dp.svg";
import { useComment } from "~/hooks/useComment";
import { useCurrentChangeRequestId } from "~/hooks/useCurrentChangeRequestId";
import { Box, Columns } from "~/components/Layout";
import Spinner from "react-spinner-material";
import { FileManager } from "@webiny/app-admin/components";
import { richTextWrapperStyles } from "../Styled";

const richTextStyles = css`
    /**
    * Make comment text only as high as comment box.
    */
    max-height: 56px;
    overflow: auto;

    & .ce-inline-toolbar {
        display: none;
    }
`;

const Loader = () => (
    <Spinner size={24} spinnerWidth={2} spinnerColor={"var(--mdc-theme-primary)"} visible={true} />
);

const CommentBoxColumns = styled(Columns)`
    min-height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

const AttachmentBox = styled(Box)<{ active: boolean }>`
    --size: 8px;
    position: relative;

    &::after {
        opacity: ${props => (props.active ? 1 : 0)};
        content: "";
        position: absolute;
        top: calc(var(--size) / 2);
        right: calc(var(--size) / 2);
        width: var(--size);
        height: var(--size);
        border-radius: 50%;
        background-color: var(--mdc-theme-primary);
    }
`;

const IconButton = styled(UiIconButton)<{ rotate?: string; fill?: string }>`
    svg {
        transform: rotate(${props => (props.rotate ? props.rotate : 0)});
        fill: ${props => (props.fill ? props.fill : "currentColor")};
    }
`;

const InputBox = styled(Box)`
    flex: 1 1 100%;

    & > div {
        //padding: 8px 16px !important;
    }

    & .ce-toolbar {
        //display: none !important;
    }

    & .ce-inline-toolbar {
        //display: none !important;
    }
`;

interface CommentBoxProps {
    scrollToLatestComment: Function;
}

export const CommentBox: React.FC<CommentBoxProps> = ({ scrollToLatestComment }) => {
    const [loading, setLoading] = useState<boolean>(false);
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
                setLoading(true);
                const response = await createComment({ variables: { data } });
                /*
                 * After submitting comment we're using the "id" state to re-mount entire Form component,
                 * so that we have a clean slate for "RichTextEditor" for new comment.
                 */
                setCommentBoxKey(get(response, "data.apw.comment.data.id"));
                setLoading(false);
                scrollToLatestComment();
            }}
        >
            {({ Bind, submit, data }) => (
                <CommentBoxColumns space={2} alignItems={"center"} paddingX={6}>
                    <AttachmentBox active={data.media}>
                        <Bind name={"media"}>
                            {props => (
                                <FileManager
                                    onUploadCompletion={([file]) => props.onChange(file)}
                                    onChange={props.onChange}
                                    scope={"scope:apw"}
                                    own={true}
                                >
                                    {({ showFileManager }) => (
                                        <IconButton
                                            icon={<AttachFileIcon />}
                                            rotate={"45deg"}
                                            onClick={() => {
                                                showFileManager();
                                            }}
                                        />
                                    )}
                                </FileManager>
                            )}
                        </Bind>
                    </AttachmentBox>

                    <InputBox style={{ flex: "1 1 100%" }}>
                        <Bind name={"body"} validators={validation.create("required,minLength:1")}>
                            <RichTextEditor
                                placeholder={`Type something to send...`}
                                className={cx(richTextWrapperStyles, richTextStyles)}
                            />
                        </Bind>
                    </InputBox>
                    <Box>
                        <IconButton
                            icon={loading ? <Loader /> : <SendIcon />}
                            fill={"var(--mdc-theme-secondary)"}
                            onClick={submit}
                            disabled={loading}
                        />
                    </Box>
                </CommentBoxColumns>
            )}
        </Form>
    );
};
