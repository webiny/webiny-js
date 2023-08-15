export interface ExportCmsStructureQueryVariables {
    code?: boolean;
    targets?: {
        [group: string]: string[];
    };
}

export const EXPORT_CMS_STRUCTURE_QUERY = /* GraphQL */ `
    query ExportContentModelGroupsQuery($code: Boolean, $targets: ExportCmsStructureTargetsInput) {
        exportCmsStructure(code: $code, targets: $targets) {
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
