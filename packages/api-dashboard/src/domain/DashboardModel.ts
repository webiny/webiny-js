import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const DASHBOARD_MODEL_ID = "wbyAdminDashboard";

class DashboardPrivateModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: DASHBOARD_MODEL_ID,
                    name: "Admin Dashboard",
                    lifecycleEvents: false
                })
                .fields(fields => ({
                    ownerId: fields.text().label("Owner ID").required("Owner ID is required."),
                    columns: fields
                        .object()
                        .label("Columns")
                        .list()
                        .fields(fields => ({
                            widgets: fields.text().label("Widgets").list()
                        })),
                    hidden: fields.text().label("Hidden widgets").list(),
                    columnCount: fields
                        .number()
                        .label("Column count")
                        .required("Column count is required.")
                }))
        ];
    }
}

export const DashboardModel = ModelFactory.createImplementation({
    implementation: DashboardPrivateModelImpl,
    dependencies: []
});
