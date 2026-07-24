import { type Container, createFeature } from "@webiny/feature/api";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "~/settings/DisableIndexing.js";
import { EnableIndexing } from "~/settings/EnableIndexing.js";
import { IndexManagerFactory } from "~/IndexManagerFactory.js";
import { DdbStorageScanner } from "~/StorageScanner.js";
import { DdbStorageWriter } from "~/StorageWriter.js";

export const SearchIndexTasksDdbOsFeature = createFeature({
    name: "SearchIndexTasksDdbOs",
    register(container: Container) {
        container.register(DdbStorageScanner);
        container.register(DdbStorageWriter);
        container.register(IndexSettingsManager);
        container.register(DisableIndexing);
        container.register(EnableIndexing);
        container.register(IndexManagerFactory);
    }
});
