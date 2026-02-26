import { useEffect } from "react";
import { useContentEntryForm } from "webiny/admin/cms/entry/editor";
import { useLivePreview } from "./useLivePreview";

const getWindowObject = () => {
    const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;

    if (!iframe || !iframe.contentWindow) {
        return null;
    }

    return iframe.contentWindow;
};

/**
 * Decorate `useContentEntryForm` hook, and notify the Live Preview when changes happen.
 */
export const LivePreviewEditor = useContentEntryForm.createDecorator(baseHook => {
    return () => {
        const { updateLivePreview, onPreviewReady } = useLivePreview(getWindowObject);

        const hook = baseHook();

        useEffect(() => {
            onPreviewReady(() => updateLivePreview(hook.entry));
        }, [hook.entry]);

        useEffect(() => {
            updateLivePreview(hook.entry);
        }, [hook.entry]);

        return hook;
    };
});
