import { createFeature } from "@webiny/feature/admin";
import { BulkPublishPresenterImplementation } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenterImplementation } from "./BulkUnpublishPresenter.js";
import { BulkDeletePresenterImplementation } from "./BulkDeletePresenter.js";
import { BulkDuplicatePresenterImplementation } from "./BulkDuplicatePresenter.js";
import { BulkMovePresenterImplementation } from "./BulkMovePresenter.js";
import { BulkPublishPresenter } from "./abstractions.js";
import { BulkUnpublishPresenter } from "./abstractions.js";
import { BulkDeletePresenter } from "./abstractions.js";
import { BulkDuplicatePresenter } from "./abstractions.js";
import { BulkMovePresenter } from "./abstractions.js";

export const BulkPublishFeature = createFeature({
    name: "WbPages/BulkPublish",
    register(container) {
        container.register(BulkPublishPresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkPublishPresenter) };
    }
});

export const BulkUnpublishFeature = createFeature({
    name: "WbPages/BulkUnpublish",
    register(container) {
        container.register(BulkUnpublishPresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkUnpublishPresenter) };
    }
});

export const BulkDeleteFeature = createFeature({
    name: "WbPages/BulkDelete",
    register(container) {
        container.register(BulkDeletePresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDeletePresenter) };
    }
});

export const BulkDuplicateFeature = createFeature({
    name: "WbPages/BulkDuplicate",
    register(container) {
        container.register(BulkDuplicatePresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDuplicatePresenter) };
    }
});

export const BulkMoveFeature = createFeature({
    name: "WbPages/BulkMove",
    register(container) {
        container.register(BulkMovePresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkMovePresenter) };
    }
});
