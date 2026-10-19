import React from "react";
import { DialogsProvider } from "@webiny/app-admin/components/index.js";
import { Heading } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { AdminExtensionTable } from "./AdminExtensionTable.js";

export const AdminExtensionListPage = () => {
    return (
        <DialogsProvider>
            <div className="flex h-main-content flex-col">
                <div className="flex flex-col gap-xs px-md py-sm">
                    <Heading level={5}>Admin extensions</Heading>
                    <Text size="sm" className="text-neutral-muted">
                        Changes to the admin made by the assistant. A disabled extension stays here
                        and is not loaded.
                    </Text>
                </div>
                <Separator />
                <AdminExtensionTable />
            </div>
        </DialogsProvider>
    );
};
