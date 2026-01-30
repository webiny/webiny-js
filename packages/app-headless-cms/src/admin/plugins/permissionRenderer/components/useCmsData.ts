import gql from "graphql-tag";
import { useQuery } from "../../../hooks/index.js";
import type { CmsErrorResponse } from "~/types.js";

export interface CmsDataCmsGroup {
    id: string;
    slug: string;
    label: string;
}
export interface CmsDataCmsModel<TGroup = string> {
    id: string;
    modelId: string;
    label: string;
    group: TGroup;
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
                group
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
                slug
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
    models: CmsDataCmsModel<CmsDataCmsGroup>[];
    groups: CmsDataCmsGroup[];
}

export const useCmsData = (): UseCmsDataResponseRecords => {
    const { data } = useQuery<ListCmsPermissionsResponse>(LIST_DATA);

    const groups = data?.listContentModelGroups.data ?? [];

    return {
        models: (data?.listContentModels.data ?? [])
            .filter(model => model.group !== "hidden")
            .map(model => {
                // `model.group` is a slug. we need to remap it to actual group object.
                return { ...model, group: groups.find(item => item.slug === model.group)! };
            }),
        groups
    };
};
