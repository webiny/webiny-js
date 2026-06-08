import { createFeature } from "@webiny/feature/admin";
import { BulkPublishPresenterImplementation } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenterImplementation } from "./BulkUnpublishPresenter.js";
import { BulkDeletePresenterImplementation } from "./BulkDeletePresenter.js";
import { BulkMovePresenterImplementation } from "./BulkMovePresenter.js";
import { BulkPublishPresenter } from "./abstractions.js";
import { BulkDeletePresenter } from "./abstractions.js";
import { BulkUnpublishPresenter } from "./abstractions.js";
import { BulkMovePresenter } from "./abstractions.js";

export const BulkPublishFeature = createFeature({
    name: "CmsContentEntries/BulkPublish",
    register(container) {
        container.register(BulkPublishPresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkPublishPresenter) };
    }
});

export const BulkUnpublishFeature = createFeature({
    name: "CmsContentEntries/BulkUnpublish",
    register(container) {
        container.register(BulkUnpublishPresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkUnpublishPresenter) };
    }
});

export const BulkDeleteFeature = createFeature({
    name: "CmsContentEntries/BulkDelete",
    register(container) {
        container.register(BulkDeletePresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkDeletePresenter) };
    }
});

export const BulkMoveFeature = createFeature({
    name: "CmsContentEntries/BulkMove",
    register(container) {
        container.register(BulkMovePresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(BulkMovePresenter) };
    }
});
