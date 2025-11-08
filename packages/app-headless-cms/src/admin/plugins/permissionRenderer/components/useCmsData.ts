import gql from "graphql-tag";
import { useQuery } from "../../../hooks/index.js";
import type { CmsErrorResponse } from "~/types.js";

export interface CmsDataCmsGroup {
    id: string;
    label: string;
}
export interface CmsDataCmsModel {
    id: string;
    modelId: string;
    label: string;
    group: CmsDataCmsGroup;
}
/**
 * ########################
 * List CMS Models And Groups for Permissions
 */
interface ListCmsPermissionsResponse {
    listContentModels: {
        data: CmsDataCmsModel[];
        error?: CmsErrorResponse;
    };
    listContentModelGroups: {
        data: CmsDataCmsGroup[];
        error?: CmsErrorResponse;
    };
}
const LIST_DATA = gql`
    query CmsLoadPermissionsData {
        listContentModels {
            data {
                modelId
                id: modelId
                label: name
                group {
                    id
                    label: name
                }
            }
            meta {
                totalCount
                cursor
                hasMoreItems
            }
            error {
                code
                message
                data
            }
        }
        listContentModelGroups {
            data {
                id
                label: name
            }
            meta {
                totalCount
                cursor
                hasMoreItems
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export interface UseCmsDataResponseRecords {
    models: CmsDataCmsModel[];
    groups: CmsDataCmsGroup[];
}

export const useCmsData = (): UseCmsDataResponseRecords => {
    const { data } = useQuery<ListCmsPermissionsResponse>(LIST_DATA);

    return {
        models: data?.listContentModels.data ?? [],
        groups: data?.listContentModelGroups.data ?? []
    };
};
