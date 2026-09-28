/**
 * The comparison page.
 *
 * Side by side, never an overlay or a slider. The two pages differ in height — a migrated page is
 * routinely half or twice its source — and a slider across images of different heights compares
 * whatever happens to be at the same offset, which is misleading rather than informative.
 *
 * **No similarity score, deliberately.** Heights differ, fonts load differently, and one extra or
 * missing section shifts everything below it, so a single number reads 0.62 on a page that migrated
 * well. The four signals measure content and the screenshots show appearance, and the useful output is
 * where they DISAGREE: a page can carry every text run and every destination and still look wrong
 * because a component's layout differs. Collapsing that into one figure destroys the only thing here
 * that says anything about layout fidelity.
 */

const escape = value =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const percent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : null);

/** A one-line reading of how a page's content signals stand, used to order and to colour. */
export const concern = page => {
    const signals = page.signals ?? {};
    const coverage = percent(signals.textPresent, signals.textTotal);
    const placed = signals.composedInstances ?? 0;
    const assembled = signals.assembledInstances ?? 0;
    const gap = assembled - placed;

    return {
        coverage,
        gap,
        // Lowest coverage first, then the largest shortfall in placed sections.
        rank: (coverage ?? 0) - gap * 10
    };
};

const signalRow = page => {
    const s = page.signals ?? {};
    const coverage = percent(s.textPresent, s.textTotal);
    const images = s.images ?? {};

    return `
        <dl class="signals">
            <div><dt>sections in source</dt><dd>${escape(s.sourceSections ?? "—")}</dd></div>
            <div><dt>instances assembled</dt><dd>${escape(s.assembledInstances ?? "—")}</dd></div>
            <div><dt>instances composed</dt><dd>${escape(s.composedInstances ?? "—")}</dd></div>
            <div><dt>text carried</dt><dd>${s.textPresent ?? "—"} / ${s.textTotal ?? "—"}${
                coverage === null ? "" : ` (${coverage}%)`
            }</dd></div>
            <div><dt>destinations</dt><dd>${escape(s.links?.after ?? "—")} (${escape(s.links?.rewritten ?? 0)} rewritten)</dd></div>
            <div><dt>images</dt><dd>${escape(images.rewritten ?? 0)} migrated, ${escape(images.unmigrated ?? 0)} left, ${escape(images.dropped ?? 0)} invented</dd></div>
        </dl>
    `;
};

const renderedRow = page => {
    const r = page.rendered;
    if (!r) {
        return "";
    }
    return `
        <dl class="signals rendered">
            <div><dt>rendered height</dt><dd>${escape(r.height)}px</dd></div>
            <div><dt>images on page</dt><dd>${escape(r.images)}${r.brokenImages ? ` (${escape(r.brokenImages)} broken)` : ""}</dd></div>
            <div><dt>text on page</dt><dd>${escape(r.textLength)} chars</dd></div>
            <div><dt>settled</dt><dd>${r.settled ? `yes, ${escape(r.settledInMs)}ms` : "NO — hit the ceiling"}</dd></div>
        </dl>
    `;
};

const pageSection = page => {
    if (page.status !== "compared") {
        return `
        <section class="page skipped">
            <h3>${escape(page.path)}</h3>
            <p class="source">${escape(page.sourceUrl)}</p>
            <p class="reason"><strong>${escape(page.status)}</strong> — ${escape(page.reason)}</p>
            ${signalRow(page)}
        </section>`;
    }

    const c = concern(page);
    return `
        <section class="page">
            <h3>${escape(page.path)}${c.coverage !== null && c.coverage < 60 ? ' <span class="flag">low text coverage</span>' : ""}${
                c.gap > 0 ? ` <span class="flag">${c.gap} section(s) unplaced</span>` : ""
            }</h3>
            <p class="source">${escape(page.sourceUrl)}</p>
            <div class="pair">
                <figure>
                    <figcaption>source</figcaption>
                    ${page.sourceImage ? `<img src="${escape(page.sourceImage)}" alt="source">` : `<p class="missing">no source screenshot</p>`}
                </figure>
                <figure>
                    <figcaption>migrated</figcaption>
                    ${page.composedImage ? `<img src="${escape(page.composedImage)}" alt="migrated">` : `<p class="missing">not captured</p>`}
                </figure>
            </div>
            ${signalRow(page)}
            ${renderedRow(page)}
        </section>`;
};

export const buildReport = ({ site, runId, pages, capturedAt }) => {
    const compared = pages.filter(p => p.status === "compared");
    const skipped = pages.filter(p => p.status !== "compared");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(site)} — migrated against source</title>
<style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 24px; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f6f5; color: #1a1a1a; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #666; margin: 0 0 24px; }
    .note { background: #fff; border-left: 3px solid #999; padding: 12px 16px; margin: 0 0 24px; max-width: 70ch; }
    .page { background: #fff; border: 1px solid #e3e3e1; border-radius: 6px; padding: 16px; margin: 0 0 20px; }
    .page.skipped { background: #fbf9f4; }
    h3 { font-size: 15px; margin: 0 0 2px; font-family: ui-monospace, SFMono-Regular, monospace; }
    .source { color: #777; font-size: 12px; margin: 0 0 12px; word-break: break-all; }
    .reason { margin: 0 0 12px; }
    .flag { display: inline-block; font-family: -apple-system, sans-serif; font-size: 11px; font-weight: 600; background: #fdebd0; color: #7a4f01; border-radius: 3px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 900px) { .pair { grid-template-columns: 1fr; } }
    figure { margin: 0; }
    figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin-bottom: 6px; }
    img { width: 100%; height: auto; display: block; border: 1px solid #e3e3e1; background: #fff; }
    .missing { color: #999; font-style: italic; padding: 24px; border: 1px dashed #ddd; text-align: center; }
    .signals { display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 12px 0 0; padding: 10px 0 0; border-top: 1px solid #eee; }
    .signals.rendered { border-top-style: dashed; }
    .signals div { display: flex; gap: 6px; }
    dt { color: #777; font-size: 12px; }
    dd { margin: 0; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<h1>${escape(site)} — migrated against source</h1>
<p class="meta">run ${escape(runId)} · ${escape(compared.length)} compared, ${escape(skipped.length)} not compared · ${escape(capturedAt)}</p>

<div class="note">
    <p style="margin:0 0 8px"><strong>There is no similarity score, on purpose.</strong> Heights differ, fonts load differently, and one missing section shifts everything below it — a single number reads badly on a page that migrated well.</p>
    <p style="margin:0">The signals beneath each pair measure <em>content</em>, from the page document. The screenshots show <em>appearance</em>. Where they disagree is the point: a page can carry every text run and every destination and still look wrong, and that disagreement is the only thing here that says anything about layout.</p>
</div>

<p class="meta">Ordered most-likely-wrong first: lowest text coverage, then the largest shortfall in placed sections.</p>

${pages.map(pageSection).join("\n")}
</body>
</html>`;
};
