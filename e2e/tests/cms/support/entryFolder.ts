import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";

/** A folder of a model's entries. */
export interface EntryFolder {
    id: string;
    title: string;
}

interface AcoError {
    code: string | null;
    message: string | null;
}

interface ListFoldersData {
    aco: {
        listFolders: {
            data: EntryFolder[] | null;
            error: AcoError | null;
        };
    };
}

interface DeleteFolderData {
    aco: {
        deleteFolder: {
            error: AcoError | null;
        };
    };
}

const LIST_FOLDERS = /* GraphQL */ `
    query ListFolders($type: String!) {
        aco {
            listFolders(where: { type: $type }, limit: 1000) {
                data {
                    id
                    title
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const DELETE_FOLDER = /* GraphQL */ `
    mutation DeleteFolder($id: ID!) {
        aco {
            deleteFolder(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

/** Finds the model's entry folder titled `title`, or null. */
export const findEntryFolder = async (
    session: ApiSession,
    model: TestModel,
    title: string
): Promise<EntryFolder | null> => {
    const result = await callGraphql<ListFoldersData>(session, "graphql", LIST_FOLDERS, {
        type: `cms:${model.modelId}`
    });
    const listed = requireData(result, "listFolders").aco.listFolders;
    if (!listed.data) {
        throw new Error(`listFolders failed: ${listed.error?.message}`);
    }
    return listed.data.find(folder => folder.title === title) ?? null;
};

/** Deletes the folder. Empty it first. Returns the error message, or null when it is gone. */
export const deleteEntryFolder = async (
    session: ApiSession,
    folder: EntryFolder
): Promise<string | null> => {
    const result = await callGraphql<DeleteFolderData>(session, "graphql", DELETE_FOLDER, {
        id: folder.id
    });
    return result.errors?.[0]?.message ?? result.data?.aco.deleteFolder.error?.message ?? null;
};
