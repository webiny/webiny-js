import React from "react";
import { AdminConfig, AdminLayout, RegisterFeature, useRouter } from "@webiny/app-admin";
import { ReactComponent as ExtractionIcon } from "@webiny/icons/travel_explore.svg";
import { COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA } from "~/constants.js";
import { ComponentExtractionPermissionsFeature } from "~/features/permissions/feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { ExtractionListPage } from "~/presentation/ExtractionList/components/ExtractionListPage.js";
import { RunViewPage } from "~/presentation/RunView/components/RunViewPage.js";
import { CreateJobPage } from "~/presentation/CreateJob/components/CreateJobPage.js";
import { JobDetailPage } from "~/presentation/JobDetail/components/JobDetailPage.js";
import { Routes } from "~/routes.js";

const { Security, Menu, Route } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();

    return (
        <>
            <RegisterFeature feature={ComponentExtractionPermissionsFeature} />
            <RegisterFeature feature={ComponentExtractionGatewayFeature} />

            <AdminConfig>
                <Security.Permissions
                    name="componentExtraction"
                    title="Component Extraction"
                    description="Crawl a site and generate components from it."
                    icon={<ExtractionIcon />}
                    schema={COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA}
                />

                <HasPermission entity="componentExtraction">
                    <Route
                        route={Routes.List}
                        element={
                            <AdminLayout title="Component Extraction">
                                <ExtractionListPage />
                            </AdminLayout>
                        }
                    />
                    <Route
                        route={Routes.CreateJob}
                        element={
                            <AdminLayout title="New extraction">
                                <CreateJobPage />
                            </AdminLayout>
                        }
                    />
                    <Route
                        route={Routes.Job}
                        element={
                            <AdminLayout title="Extraction job">
                                <JobDetailPage />
                            </AdminLayout>
                        }
                    />
                    <Route
                        route={Routes.Run}
                        element={
                            <AdminLayout title="Extraction run">
                                <RunViewPage />
                            </AdminLayout>
                        }
                    />
                    <Menu
                        name="component-extraction"
                        parent="dev-tools"
                        element={
                            <Menu.Link
                                text="Component Extraction"
                                to={getLink(Routes.List)}
                                icon={
                                    <Menu.Link.Icon
                                        label="Component Extraction"
                                        element={<ExtractionIcon />}
                                    />
                                }
                            />
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </>
    );
};

Extension.displayName = "ComponentExtractionExtension";
