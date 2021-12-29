import React from "react";
import { Box, Columns } from "../../Layout";
import { IconButton as UiIconButton } from "@webiny/ui/Button";
import { ReactComponent as AttachFileIcon } from "~/admin/assets/icons/attach_file_24dp.svg";
import { ReactComponent as SendIcon } from "~/admin/assets/icons/send_24dp.svg";
import { Input } from "@webiny/ui/Input";
import styled from "@emotion/styled";

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

function CommentBox() {
    return (
        <CommentBoxColumns space={2} alignItems={"center"} paddingX={6}>
            <Box>
                <IconButton icon={<AttachFileIcon />} rotate={"45deg"} />
            </Box>
            <InputBox style={{ flex: "1 1 100%" }}>
                <Input placeholder={`Type something to send...`} fullwidth type={"text"} />
            </InputBox>
            <Box>
                <IconButton icon={<SendIcon />} fill={"var(--mdc-theme-secondary)"} />
            </Box>
        </CommentBoxColumns>
    );
}

export default CommentBox;
