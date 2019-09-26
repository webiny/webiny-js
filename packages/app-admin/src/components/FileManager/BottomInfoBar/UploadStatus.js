// @flow
import React from "react";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";

const StatusWrapper = styled("div")({
    color: "var(--mdc-theme-primary)",
    position: "absolute",
    right: 0,
    bottom: 10,
    marginRight: 10,
    display: "flex",
    alignItems: "center",
    "> div": {
        display: "inline-block"
    }
});

const CircularProgressHolder = styled("div")({
    position: "relative",
    height: 12,
    width: 12
});

const UploadingLabel = styled("div")({
    marginRight: 5
});

const UploadStatus = ({ uploading }: Object) => {
    if (!uploading) {
        return null;
    }

    return (
        <StatusWrapper>
            <UploadingLabel>Uploading...</UploadingLabel>
            <CircularProgressHolder>
                <CircularProgress size={10} spinnerWidth={1} />
            </CircularProgressHolder>
        </StatusWrapper>
    );
};

export default UploadStatus;
