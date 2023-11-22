import React, { useState } from "react";
import { WcpProviderComponent } from "./contexts";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { GetWcpProjectGqlResponse, WcpProject } from "~/types";

export const GET_WCP_PROJECT = gql`
    query GetWcpProject {
        wcp {
            getProject {
                data {
                    package {
                        features {
                            seats {
                                enabled
                                options
                            }
                            multiTenancy {
                                enabled
                                options
                            }
                            advancedPublishingWorkflow {
                                enabled
                            }
                            advancedAccessControlLayer {
                                enabled
                                options
                            }
                            auditLogs {
                                enabled
                            }
                        }
                    }
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

interface WcpProviderProps {
    loader?: React.ReactElement;
}

export const WcpProvider: React.FC<WcpProviderProps> = ({ children, loader }) => {
    // If `REACT_APP_WCP_PROJECT_ID` environment variable is missing, we can immediately exit.
    if (!process.env.REACT_APP_WCP_PROJECT_ID) {
        return <WcpProviderComponent project={null}>{children}</WcpProviderComponent>;
    }

    const [project, setProject] = useState<WcpProject | null | undefined>(undefined);
    useQuery<GetWcpProjectGqlResponse>(GET_WCP_PROJECT, {
        skip: project !== undefined,
        context: {
            headers: {
                "x-tenant": "root"
            }
        },
        onCompleted: response => {
            setProject(response.wcp.getProject.data);
        }
    });

    // Initially, the `project` variable is `undefined`. Once the `GET_WCP_PROJECT` GQL query
    // has been resolved, then it becomes either `null` or `WcpProject`, and that's when we can continue
    // rendering child React components.
    if (project === undefined) {
        return loader || null;
    }

    return <WcpProviderComponent project={project}>{children}</WcpProviderComponent>;
};
