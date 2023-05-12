// For now, no special enterprise features are available for the Admin app.
// We're simply reexporting everything from the base Admin Pulumi app.
export {
    createAdminPulumiApp,
    CreateAdminPulumiAppParams,
    AdminPulumiApp
} from "~/apps/admin/createAdminPulumiApp";
