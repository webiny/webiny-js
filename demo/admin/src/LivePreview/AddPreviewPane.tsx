import React, { useCallback, useEffect, useRef } from "react";
import { ContentEntryEditorConfig, useModel } from "@webiny/app-headless-cms";
import styled from "@emotion/styled";

const getPreviewDomain = () => {
    if (window.location.origin.includes("localhost")) {
        return `http://localhost:3000`;
    }

    return `https://druexxzabmhs4.cloudfront.net`;
};

const SplitView = styled.div`
    display: flex;
    > div {
        flex: 1;
    }
`;

const LivePreviewContainer = styled.div`
    padding: 30px;
    border-right: 1px solid var(--mdc-theme-on-background);
`;

const { ContentEntry } = ContentEntryEditorConfig;

const PreviewPane = () => {
    return (
        <LivePreviewContainer>
            <iframe
                id={"live-preview-iframe"}
                sandbox={"allow-same-origin allow-scripts allow-forms"}
                src={getPreviewDomain() + "/live-preview?preview=true"}
                width="100%"
                height="100%"
            />
        </LivePreviewContainer>
    );
};

type OnReady = () => void;

function useLivePreview() {
    const onReadyRefs = useRef<OnReady>();

    const updateLivePreview = useCallback((data: Record<string, any>) => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (!iframe || !iframe.contentWindow) {
            return;
        }

        iframe.contentWindow.postMessage(data, "*");
    }, []);

    useEffect(() => {
        window.addEventListener("message", function (event) {
            if (event.data === "livePreviewReady") {
                if (onReadyRefs.current) {
                    onReadyRefs.current();
                }
            }
        });
    }, []);

    const onReady = (cb: OnReady) => {
        onReadyRefs.current = cb;
    };

    return { updateLivePreview, onReady };
}

export const DecorateUseContentEntryForm =
    ContentEntry.ContentEntryForm.useContentEntryForm.createDecorator(baseHook => {
        return params => {
            const { updateLivePreview, onReady } = useLivePreview();

            const hook = baseHook({
                ...params,
                onChange: (data, form) => {
                    updateLivePreview(data);

                    if (params.onChange) {
                        return params.onChange(data, form);
                    }
                }
            });

            useEffect(() => {
                onReady(() => updateLivePreview(hook.data));
            }, [hook.data]);

            return hook;
        };
    });

export const AddPreviewPane = ContentEntry.ContentEntryForm.createDecorator(Original => {
    return function ContentEntryForm(props) {
        const { model } = useModel();
        if (model.modelId !== "article") {
            return <Original {...props} />;
        }

        return (
            <SplitView>
                <PreviewPane />
                <div>
                    <Original {...props} />
                </div>
            </SplitView>
        );
    };
});
