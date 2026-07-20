export interface CmsReferenceEntry {
    id: string;
    entryId: string;
    status: string;
    title: string;
    description: string | null;
    image: string | null;
    createdOn: string;
    savedOn: string;
    createdBy: { id: string; type: string; displayName: string };
    modifiedBy: { id: string; type: string; displayName: string } | null;
    model: { modelId: string; name: string };
    published: { id: string; entryId: string; title: string } | null;
    wbyAco_location: { folderId: string } | null;
}

export interface CmsReferenceValue {
    id: string;
    modelId: string;
}

/**
 * A partial update to an already-resolved reference entry, keyed by `entryId`.
 * Used to patch the in-memory card after editing a referenced entry, avoiding a refetch.
 */
export type CmsReferenceEntryPatch = Partial<CmsReferenceEntry> & { entryId: string };

export const REFERENCE_ENTRY_FIELDS = /* GraphQL */ `
    data {
        id
        entryId
        status
        title
        description
        image
        createdOn
        savedOn
        createdBy {
            id
            type
            displayName
        }
        modifiedBy {
            id
            type
            displayName
        }
        model {
            modelId
            name
        }
        published {
            id
            entryId
            title
        }
        wbyAco_location {
            folderId
        }
    }
    error {
        message
        code
        data
    }
`;
