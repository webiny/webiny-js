import React, { useCallback } from "react";
import type { TenantEntry } from "~/admin/types.js";
import { useToast, Text } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { useDisableTenant } from "~/admin/DisableTenant/index.js";

interface UseDisableTenantDialog {
    record: TenantEntry;
}

export function useDisableTenantDialog({ record }: UseDisableTenantDialog) {
    const toast = useToast();
    const dialogs = useDialogs();
    const { disableTenant } = useDisableTenant(record);

    const disableEntry = useCallback(() => {
        dialogs.showDialog({
            title: "Are you sure you want to disable this tenant?",
            content: (
                <>
                    <Text as={"div"}>
                        Users won&apos;t be able to sign in, and all API access will stop working
                        immediately. Don&apos;t worry - you can re-enable it later if needed.
                    </Text>
                </>
            ),
            acceptLabel: "Yes, disable!",
            loadingLabel: "Disabling tenant...",
            async onAccept() {
                try {
                    await disableTenant();
                    toast.showSuccessToast({
                        title: "Tenant was disabled successfully!"
                    });
                } catch (e) {
                    toast.showWarningToast({
                        title: "Tenant could not be disabled!",
                        description: e.message,
                        duration: Infinity
                    });
                }
            }
        });
    }, [record.id]);

    return { disableEntry };
}
