import React, { useCallback } from "react";
import { Button, EmptyState, Text } from "@webiny/admin-ui";
import { ReactComponent as BookIcon } from "@webiny/icons/menu_book.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as RocketIcon } from "@webiny/icons/rocket_launch.svg";
import { FRONTEND_SETUP_DOCS_URL, SAMPLE_FRONTEND_DOMAIN } from "../sampleFrontend.js";
import { usePreviewDomain } from "../usePreviewDomain.js";
import type { PreviewConnectionError } from "./usePreviewConnection.js";

interface NoFrontendConnectedProps {
    // The origin the editor tried to load the preview from.
    origin: string;
    status: PreviewConnectionError;
    onRetry: () => void;
}

const COPY: Record<PreviewConnectionError, { title: string; description: string }> = {
    unreachable: {
        title: "No frontend detected",
        description:
            "The editor renders your pages inside your own frontend, and nothing is currently running at"
    },
    unresponsive: {
        title: "Frontend didn't connect",
        description:
            "Something is running, but it never connected to the editor. Make sure the Website Builder SDK is set up in the app running at"
    }
};

export const NoFrontendConnected = ({ origin, status, onRetry }: NoFrontendConnectedProps) => {
    const { previewDomain, setPreviewDomain } = usePreviewDomain();

    const loadSampleFrontend = useCallback(() => {
        setPreviewDomain(SAMPLE_FRONTEND_DOMAIN);
    }, [setPreviewDomain]);

    const openInstructions = useCallback(() => {
        window.open(FRONTEND_SETUP_DOCS_URL, "_blank", "noopener,noreferrer");
    }, []);

    const copy = COPY[status];

    // No point in offering the sample frontend when it's the domain that just failed to connect.
    const canLoadSampleFrontend = previewDomain !== SAMPLE_FRONTEND_DOMAIN;

    return (
        <div
            className={
                "w-full h-full absolute inset-0 z-40 flex items-center justify-center overflow-auto bg-neutral-base"
            }
        >
            <EmptyState
                type={"layout"}
                title={copy.title}
                description={
                    <>
                        {copy.description} <span className={"font-semibold"}>{origin}</span>.
                    </>
                }
                actions={
                    <>
                        <Button
                            variant={canLoadSampleFrontend ? "secondary" : "primary"}
                            size={"md"}
                            icon={<BookIcon />}
                            text={"Read the instructions"}
                            onClick={openInstructions}
                        />
                        {canLoadSampleFrontend ? (
                            <Button
                                variant={"primary"}
                                size={"md"}
                                icon={<RocketIcon />}
                                text={"Load sample frontend"}
                                onClick={loadSampleFrontend}
                            />
                        ) : null}
                        <Button
                            variant={"ghost"}
                            size={"md"}
                            icon={<RefreshIcon />}
                            text={"Try again"}
                            onClick={onRetry}
                        />
                    </>
                }
            />
            {canLoadSampleFrontend ? (
                <Text
                    as={"div"}
                    size={"sm"}
                    className={
                        "absolute bottom-0 left-0 right-0 px-lg py-md-plus text-center text-neutral-strong"
                    }
                >
                    The sample frontend lets you build pages and see them here in the editor.
                    Viewing or previewing them outside the editor needs a frontend of your own, and
                    locally uploaded images and content-bound data won&apos;t render in the sample
                    either.
                </Text>
            ) : null}
        </div>
    );
};
