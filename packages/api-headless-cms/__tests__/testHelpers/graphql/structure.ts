export interface ExportCmsStructureQueryVariables {
    code?: boolean;
    targets?: {
        [group: string]: string[];
    };
}

export const EXPORT_CMS_STRUCTURE_QUERY = /* GraphQL */ `
    query ExportContentModelGroupsQuery($models: [String!]) {
        exportCmsStructure(models: $models) {
            data
            error {
                message
                code
                data
                stack
            }
        }
    }
`;
