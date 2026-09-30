/**
 * Uploads the composed screenshots this harness just took, so the admin can show the pair.
 *
 * Three steps, and the order is the point. Ask for pre-signed PUT URLs; send the bytes straight to
 * storage; only then record what landed. The record is written last so it can never claim an image
 * that failed to upload — an allowlisted ref with nothing behind it would show the admin a broken
 * half, which is the one outcome worse than showing no composed image at all.
 *
 * The bytes go to storage directly rather than through the API. A Lambda request payload is capped at
 * 6MB and arrives base64-encoded, and a full-page screenshot of these pages regularly exceeds that;
 * posting them to a route would fail on the largest and most interesting pages.
 */

/** Pages the harness rendered but must not upload, with the reason recorded instead. */
const skipReason = record => {
    if (record.composedBytes) {
        return null;
    }
    return record.reason || "the harness produced no screenshot for this page";
};

export const uploadComposedCapture = async ({ gql, runId, pages, viewportWidth }) => {
    const uploadable = pages.filter(page => page.composedBytes);

    let composeVersion = 0;
    const refByPath = new Map();

    if (uploadable.length > 0) {
        const targets = await gql(
            `mutation ($runId: ID!, $paths: [String!]!) {
                pageCompositionPocComposedUploadTargets(runId: $runId, paths: $paths) {
                    data { composeVersion targets { path ref uploadUrl contentType } }
                    error { message }
                }
            }`,
            { runId, paths: uploadable.map(page => page.path) }
        );
        const payload = targets.pageCompositionPocComposedUploadTargets;
        if (payload?.error) {
            throw new Error(payload.error.message);
        }
        composeVersion = payload.data.composeVersion;

        for (const target of payload.data.targets) {
            const page = uploadable.find(candidate => candidate.path === target.path);
            const res = await fetch(target.uploadUrl, {
                method: "PUT",
                // The type is signed into the URL; sending anything else is rejected by storage.
                headers: { "content-type": target.contentType },
                body: page.composedBytes
            });
            if (!res.ok) {
                // Recorded as a skip rather than thrown: one page failing to upload should not cost
                // the other nine their comparison.
                page.uploadError = `upload failed with ${res.status}`;
                continue;
            }
            refByPath.set(target.path, target.ref);
        }
    } else {
        // Nothing to upload, but the run still deserves a record — "the harness ran and every page
        // was skipped" is a different statement from "nobody has run the harness".
        const map = await gql(
            `query ($runId: ID!) { pageCompositionPocPageMap(runId: $runId) { data } }`,
            { runId }
        );
        composeVersion = map.pageCompositionPocPageMap?.data?.composeVersion ?? 0;
    }

    const recorded = await gql(
        `mutation ($runId: ID!, $data: PageCompositionPocComposedCaptureInput!) {
            pageCompositionPocRecordComposedCapture(runId: $runId, data: $data) {
                data
                error { message }
            }
        }`,
        {
            runId,
            data: {
                composeVersion,
                capturedAt: new Date().toISOString(),
                viewportWidth,
                pages: pages.map(page => {
                    const ref = refByPath.get(page.path);
                    return {
                        path: page.path,
                        status: ref ? "captured" : "skipped",
                        screenshotRef: ref ?? null,
                        reason: ref ? null : (page.uploadError ?? skipReason(page)),
                        // Only where it differs, so the run-level width stays the answer for the rest.
                        viewportWidth:
                            page.viewportWidth && page.viewportWidth !== viewportWidth
                                ? page.viewportWidth
                                : null
                    };
                })
            }
        }
    );
    const payload = recorded.pageCompositionPocRecordComposedCapture;
    if (payload?.error) {
        throw new Error(payload.error.message);
    }

    return {
        composeVersion,
        uploaded: refByPath.size,
        skipped: pages.length - refByPath.size
    };
};
