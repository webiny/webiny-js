import React, { useEffect, useRef } from "react";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { UpdateFileFeature } from "~/features/updateFile/feature.js";

const FILE_ENRICHMENT_ACTION = "fm.file.enrichment";

interface FileEnrichmentMessage extends IncomingGenericData {
    action: typeof FILE_ENRICHMENT_ACTION;
    data: {
        id: string;
        tags: string[];
        description: string;
    };
}

export const HandleWebsocketMessages = () => {
    const { showSuccessToast } = useToast();
    const websockets = useWebsockets();
    const { useCase: updateFileUseCase } = useFeature(UpdateFileFeature);
    const updateRef = useRef(updateFileUseCase);
    updateRef.current = updateFileUseCase;

    useEffect(() => {
        const enrichment = websockets.onMessage<FileEnrichmentMessage>(
            FILE_ENRICHMENT_ACTION,
            async message => {
                const { id, ...data } = message.data;
                await updateRef.current.execute({ id, data });

                showSuccessToast({
                    title: "Image enriched",
                    description: "AI-generated tags and description have been added."
                });
            }
        );

        return () => {
            enrichment.off();
        };
    }, []);

    return null;
};
