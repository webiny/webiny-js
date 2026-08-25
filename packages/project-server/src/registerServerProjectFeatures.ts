import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";
import { BuildServerProjectWorkspace } from "./features/BuildServerProjectWorkspace.js";
import { serverWatch } from "./features/Watch/ServerWatch.js";
import { serverServe } from "./serve/ServerServe.js";
import { serveWithBuildChecks } from "./serve/ServeWithBuildChecks.js";
import { GenerateApiDbConnection } from "./deploy/GenerateApiDbConnection.js";
import { CopyExternalDependencies } from "./deploy/CopyExternalDependencies.js";
import { PruneUnusedDbDriver } from "./deploy/PruneUnusedDbDriver.js";
import { EmitDeployEntry } from "./deploy/EmitDeployEntry.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server hosting-type one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
    // Right after the api workspace is copied, generate its database connection from the DB infra
    // extension (<Infra.Sqlite> / <Infra.Postgres>) in webiny.config.tsx: substitute the entry's
    // {DB_FACTORY} placeholders with the chosen connection factory. Picking the driver here (build +
    // watch) keeps only the chosen one in the bundle + deploy artifact — no sqlite driver in a
    // postgres build, and vice versa.
    container.registerDecorator(GenerateApiDbConnection);
    // Copy the server `webiny.config.base.tsx` (renders <Project />, not <ProjectAws />) into the
    // workspace, so none of the AWS deploy/Pulumi hooks are composed in the self-hosted hosting type.
    container.registerDecorator(BuildServerProjectWorkspace);
    // The admin API URL is configured via `<Admin.ApiUrl>` in webiny.config.tsx (baked into the
    // bundle as WEBINY_ADMIN_API_URL), so no env-mutating watch hook is needed here.
    // Boot the built api handler as a live, reload-on-rebuild HTTP server during `watch api`
    // (server hosting-type counterpart to project-aws's Lambda invocation forwarding).
    container.registerDecorator(serverWatch);

    // Serve built apps as long-running servers (`webiny-server serve`). Replace the base
    // DefaultServe (which refuses) with the real server hosting-type implementation, then decorate it so
    // the required app builds are asserted before anything is served.
    container.register(serverServe).inSingletonScope();
    container.registerDecorator(serveWithBuildChecks);

    // After the api build, assemble build/ into a self-contained, copy-deployable folder. Two
    // ApiAfterBuild hooks (build-time only — they don't run in watch), split so the tree shows the
    // concerns: copy the external deps into build/node_modules, and emit the deploy entry (start.mjs +
    // package.json). Deploy-artifact packaging belongs with the server hosting type, not the bundler.
    container.register(CopyExternalDependencies);
    // nft copies both SQL drivers (knex loads its driver by string, so the trace can't tell which is
    // used). Prune the one the project didn't choose, right after the copy — keeps the artifact
    // single-driver (no better-sqlite3 in a postgres build, and vice versa).
    container.register(PruneUnusedDbDriver);
    container.register(EmitDeployEntry);
};
