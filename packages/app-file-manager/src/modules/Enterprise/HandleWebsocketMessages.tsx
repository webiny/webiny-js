import React, { useEffect, useRef } from "react";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useSnackbar } from "@webiny/app-admin";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";

const THREAT_SCAN_ACTIONS = {
    NO_THREAT_FOUND: "fm.threatScan.noThreatFound",
    THREAT_DETECTED: "fm.threatScan.threatDetected",
    UNSUPPORTED: "fm.threatScan.unsupported"
};

interface ThreatScan_NoThreat extends IncomingGenericData {
    action: typeof THREAT_SCAN_ACTIONS.NO_THREAT_FOUND;
    data: {
        id: string;
        tags: string[];
    };
}

interface ThreatScan_ThreatDetected extends IncomingGenericData {
    action: typeof THREAT_SCAN_ACTIONS.THREAT_DETECTED;
    data: {
        id: string;
        name: string;
    };
}

interface ThreatScan_UnsupportedFile extends IncomingGenericData {
    action: typeof THREAT_SCAN_ACTIONS.UNSUPPORTED;
    data: {
        id: string;
        name: string;
    };
}

interface AITags extends IncomingGenericData {
    action: "fm.file.tags";
    data: {
        id: string;
        tags: string[];
    };
}

export const HandleWebsocketMessages = () => {
    const { showErrorSnackbar } = useSnackbar();
    const websockets = useWebsockets();
    const fmView = useFileManagerView();
    const fmViewRef = useRef(fmView);
    fmViewRef.current = fmView;

    useEffect(() => {
        const noThreat = websockets.onMessage<ThreatScan_NoThreat>(
            THREAT_SCAN_ACTIONS.NO_THREAT_FOUND,
            async message => {
                const { id, ...data } = message.data;

                await fmViewRef.current.updateFile(id, data, {
                    localUpdate: true
                });
            }
        );

        const threatDetected = websockets.onMessage<ThreatScan_ThreatDetected>(
            THREAT_SCAN_ACTIONS.THREAT_DETECTED,
            async message => {
                const { id, name } = message.data;

                await fmViewRef.current.deleteFile(id, {
                    localDelete: true
                });

                showErrorSnackbar(
                    <span>
                        A threat was detected in file <strong>{name}</strong>, and it was
                        automatically deleted!
                    </span>
                );
            }
        );

        const unsupported = websockets.onMessage<ThreatScan_UnsupportedFile>(
            THREAT_SCAN_ACTIONS.UNSUPPORTED,
            async message => {
                const { id, name } = message.data;

                await fmViewRef.current.deleteFile(id, {
                    localDelete: true
                });

                showErrorSnackbar(
                    <span>
                        We were unable to scan the file. For security reasons, file
                        <strong>{name}</strong> was automatically deleted!
                    </span>
                );
            }
        );

        const aiTags = websockets.onMessage<AITags>("fm.file.tags", async message => {
            const { id, ...data } = message.data;

            await fmViewRef.current.updateFile(id, data, {
                localUpdate: true
            });
        });

        return () => {
            noThreat.off();
            threatDetected.off();
            unsupported.off();
            aiTags.off();
        };
    }, []);

    return null;
};
