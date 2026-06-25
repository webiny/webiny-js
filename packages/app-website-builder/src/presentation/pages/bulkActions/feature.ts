import { createFeature } from "@webiny/feature/admin";
import {
    BulkPublishPresenter as BulkPublishAbstraction,
    BulkUnpublishPresenter as BulkUnpublishAbstraction,
    BulkDeletePresenter as BulkDeleteAbstraction,
    BulkDuplicatePresenter as BulkDuplicateAbstraction,
    BulkMovePresenter as BulkMoveAbstraction
} from "./abstractions.js";
import { BulkPublishPresenter } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenter } from "./BulkUnpublishPresenter.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";
import { BulkDuplicatePresenter } from "./BulkDuplicatePresenter.js";
import { BulkMovePresenter } from "./BulkMovePresenter.js";

export const BulkPublishFeature = createFeature({
    name: "WbPages/BulkPublish",
    register(container) {
        container.register(BulkPublishPresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkPublishAbstraction) };
    }
});

export const BulkUnpublishFeature = createFeature({
    name: "WbPages/BulkUnpublish",
    register(container) {
        container.register(BulkUnpublishPresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkUnpublishAbstraction) };
    }
});

export const BulkDeleteFeature = createFeature({
    name: "WbPages/BulkDelete",
    register(container) {
        container.register(BulkDeletePresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDeleteAbstraction) };
    }
});

export const BulkDuplicateFeature = createFeature({
    name: "WbPages/BulkDuplicate",
    register(container) {
        container.register(BulkDuplicatePresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDuplicateAbstraction) };
    }
});

export const BulkMoveFeature = createFeature({
    name: "WbPages/BulkMove",
    register(container) {
        container.register(BulkMovePresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkMoveAbstraction) };
    }
});
