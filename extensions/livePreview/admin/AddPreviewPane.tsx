import React from "react";
import styled from "@emotion/styled";
import { PreviewPane } from "./PreviewPane";
import { getPreviewUrl } from "./getPreviewUrl";
import { ContentEntryForm } from "webiny/admin/cms/entry/editor";
import { useModel } from "webiny/admin/cms";

const SplitView = styled.div`
    display: flex;
    width: 95vw; // Remove this line in case you are using the legacy entry editor ("cmsLegacyEntryEditor" flag is equal to true).
    > div {
        flex: 1;
    }
`;

export const AddPreviewPane = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryForm(props) {
        const { model } = useModel();

        if (model.modelId !== "article") {
            return <Original {...props} />;
        }

        return (
            <SplitView>
                <PreviewPane previewUrl={getPreviewUrl(window.location.origin)} />
                <div>
                    <Original {...props} />
                </div>
            </SplitView>
        );
    };
});
