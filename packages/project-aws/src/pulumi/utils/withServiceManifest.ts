import merge from "lodash/merge.js";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { ServiceManifest, TableDefinition } from "./addServiceManifestTableItem.js";
import { addServiceManifestTableItem } from "./addServiceManifestTableItem.js";
import { CoreOutput } from "~/pulumi/apps/index.js";

export interface WithServiceManifest {
    addServiceManifest(manifest: ServiceManifest): void;
    /**
     * Every manifest the app publishes, once all are added: the same set the DynamoDB table gets.
     * Resolves after the app's handlers have run, so a resource can take it as an input from
     * anywhere in the program.
     */
    getServiceManifests(): pulumi.Output<ServiceManifest[]>;
}

interface ApplyManifests {
    (manifests: ServiceManifest[]): void;
}

const defaultApplyManifests = (app: PulumiApp, manifests: ServiceManifest[]) => {
    const core = app.getModule(CoreOutput);

    const table: TableDefinition = {
        tableName: core.primaryDynamodbTableName,
        hashKey: core.primaryDynamodbTableHashKey,
        rangeKey: core.primaryDynamodbTableRangeKey
    };

    manifests.forEach(manifest => addServiceManifestTableItem(app, table, manifest));
};

/**
 * Augment the given app with `addServiceManifest` functionality.
 * @param {PulumiApp} app
 */
export function withServiceManifest<T extends PulumiApp>(
    app: T,
    applyManifests?: ApplyManifests
): T & WithServiceManifest {
    const manifests: Record<string, ServiceManifest> = {};

    let resolveManifests: (manifests: ServiceManifest[]) => void = () => undefined;
    const finalManifests = pulumi.output(
        new Promise<ServiceManifest[]>(resolve => {
            resolveManifests = resolve;
        })
    );

    function addServiceManifest(manifest: ServiceManifest) {
        manifests[manifest.name] = merge({}, manifests[manifest.name], manifest);
    }

    function getServiceManifests() {
        return finalManifests;
    }

    app.decorateProgram<WithServiceManifest>(async (program, app) => {
        const output = await program({
            ...app,
            addServiceManifest,
            getServiceManifests
        });

        // Added after the program's own handlers, so it sees the manifests they add too.
        app.addHandler(() => {
            const all = Object.values(manifests);
            if (!applyManifests) {
                defaultApplyManifests(app, all);
            } else {
                applyManifests(all);
            }
            resolveManifests(all);
        });

        return output;
    });

    // Augment the original PulumiApp.
    return {
        ...app,
        addServiceManifest,
        getServiceManifests
    };
}
