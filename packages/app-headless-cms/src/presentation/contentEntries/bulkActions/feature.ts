import { createFeature } from "@webiny/feature/admin";
import {
    BulkPublishPresenter as BulkPublishAbstraction,
    BulkDeletePresenter as BulkDeleteAbstraction,
    BulkUnpublishPresenter as BulkUnpublishAbstraction,
    BulkMovePresenter as BulkMoveAbstraction
} from "./abstractions.js";
import { BulkPublishPresenter } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenter } from "./BulkUnpublishPresenter.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";
import { BulkMovePresenter } from "./BulkMovePresenter.js";

export const BulkPublishFeature = createFeature({
    name: "CmsContentEntries/BulkPublish",
    register(container) {
        container.register(BulkPublishPresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkPublishAbstraction) };
    }
});

export const BulkUnpublishFeature = createFeature({
    name: "CmsContentEntries/BulkUnpublish",
    register(container) {
        container.register(BulkUnpublishPresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkUnpublishAbstraction) };
    }
});

export const BulkDeleteFeature = createFeature({
    name: "CmsContentEntries/BulkDelete",
    register(container) {
        container.register(BulkDeletePresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDeleteAbstraction) };
    }
});

export const BulkMoveFeature = createFeature({
    name: "CmsContentEntries/BulkMove",
    register(container) {
        container.register(BulkMovePresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkMoveAbstraction) };
    }
});
