import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import type { Company } from "@demo/tenant-management-shared";

const GET_CURRENT_COMPANY = gql`
    query GetCurrentCompany {
        currentCompany {
            data 
            error {
                code
                message
                data
            }
        }
    }
`;

interface GetCurrentCompanyResponse {
    currentCompany: {
        data: Company | undefined;
        error:
            | undefined
            | {
                  code: string;
                  message: string;
                  data: Record<string, any>;
              };
    };
}

export function useCurrentCompanyQuery() {
    const query = useQuery<GetCurrentCompanyResponse>(GET_CURRENT_COMPANY);

    const { data, error, loading } = query;

    if (loading) {
        return {
            company: undefined,
            error: undefined,
            loading: true
        };
    }

    if (!data) {
        return {
            company: undefined,
            error: error,
            loading: false
        };
    }

    const response = data.currentCompany;

    return {
        company: response.data,
        error: response.error,
        loading
    };
}
