import { useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { FileItem } from "../types";
import { UPDATE_FILE } from "~/components/FileManager/graphql";

type UpdateApolloCache = Parameters<ReturnType<typeof useApolloClient>["mutate"]>[0]["update"];

export const useUpdateFile = (file: FileItem) => {
    const client = useApolloClient();
    const [saving, setSaving] = useState(false);

    const updateFile = async (data: Partial<FileItem>, updateCache?: UpdateApolloCache) => {
        setSaving(true);
        await client.mutate({
            mutation: UPDATE_FILE,
            variables: {
                id: file.id,
                data
            },
            update(cache, result) {
                if (updateCache) {
                    updateCache(cache, result);
                }
            }
        });
        setSaving(false);
    };

    return { updateFile, updateInProgress: saving };
};
