/**
 * Refuse to compare against an app that is not serving this run's composition.
 *
 * This exists because of a real hour lost. Two instances of the website app were running on
 * neighbouring ports, the harness defaults to one of them, and probing during a recompose returned
 * 500s that read exactly like a rendering regression. Nothing in the output said which app had been
 * photographed, so the screenshots could not be used to tell the difference.
 *
 * A comparison harness that silently photographs the wrong app produces confident, wrong evidence,
 * which is worse than producing none. So it checks first, names the URL it is talking to, and stops
 * when the page served is not the page the map names.
 *
 * It checks the page ID rather than the title. Titles only distinguish one SITE from another, and
 * the collision that actually bites is between COMPOSITIONS of the same site, which share titles
 * exactly.
 */

const titleOf = html => {
    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html ?? "");
    return match ? match[1].trim() : "";
};

/**
 * Whether the served HTML is the page with this id.
 *
 * The rendered document carries its own page id, so this asks the exact question — is this the page
 * the map names — rather than the approximate one. The title check it replaces compared copy, which
 * catches a page from another SITE answering the path, and cannot catch one from another
 * COMPOSITION of the same site, because those produce identical titles. Every path had up to four
 * claimants when this was written, so the approximate question was the wrong one.
 */
const servesPageId = (html, pageId) => (html ?? "").includes(pageId);

/**
 * A page the app should agree with.
 *
 * Never `/`. Every site's home page composes to that one path, so a mismatch there is the known
 * cross-site collision rather than the wrong app, and preflighting on it would fail every run but
 * one.
 */
const witness = map => (map?.pages ?? []).find(page => page.path !== "/" && page.pageId) ?? null;

/** The page a path actually resolves to, or null. */
const livePageId = async (gql, path) => {
    try {
        const d = await gql(
            `query ($p: String!) { websiteBuilder { getPageByPath(path: $p) { data { id } error { message } } } }`,
            { p: path }
        );
        return d.websiteBuilder?.getPageByPath?.data?.id ?? null;
    } catch {
        return null;
    }
};

/** Whether a page is still published. A superseded run's pages are not. */
const isPublished = async (gql, pageId) => {
    try {
        const d = await gql(
            `query ($id: ID!) { websiteBuilder { listPages(where: { published: true, id: $id }, limit: 1) { data { id } } } }`,
            { id: pageId }
        );
        return (d.websiteBuilder?.listPages?.data ?? []).length > 0;
    } catch {
        // Unknown, so say nothing about it rather than claim it is unpublished.
        return true;
    }
};

export const assertWebsiteServesRun = async ({ website, site, map, gql }) => {
    const page = witness(map);
    if (!page) {
        // Nothing to check against. Said out loud rather than passed over, because an unchecked run
        // is the state this whole file exists to make impossible to reach silently.
        return { checked: false, note: "no page with an id to check against" };
    }

    const url = `${website}${page.path}`;
    let response;
    try {
        response = await fetch(url, { redirect: "follow" });
    } catch (error) {
        throw new Error(
            `${site}: cannot reach the website app at ${website} (${String(error.message).slice(0, 80)}).\n` +
                `  Start it, and set WEBSITE_URL if it is not on ${website} — a second instance on ` +
                `another port is the usual reason this fails.`
        );
    }

    if (!response.ok) {
        throw new Error(
            `${site}: ${url} returned ${response.status}.\n` +
                `  A composed page that does not render cannot be compared. If a composition is ` +
                `running, wait for it to finish — pages are deleted and recreated while it does, ` +
                `and probing mid-flight returns errors that look like a rendering defect.`
        );
    }

    const html = await response.text();
    if (servesPageId(html, page.pageId)) {
        return { checked: true, url: website, witness: page.path };
    }

    /*
     * The path is answering with a different page, and WHICH case this is decides what to do about
     * it — so it is diagnosed rather than guessed at.
     *
     * Superseded: composing a run makes it the live composition of its job and unpublishes the
     * others, so an older run's pages are deliberately not served. Nothing is broken and the remedy
     * is a choice, not a repair.
     *
     * Contested: this run's page is still published and something else answers the path anyway —
     * two live pages claim it, which is the collision worth chasing.
     *
     * An earlier version of this message asserted the second without checking, and said it in terms
     * of a defect that had since been fixed. A guard that stops you is only as useful as its reason.
     */
    const live = await livePageId(gql, page.path);
    const published = await isPublished(gql, page.pageId);

    const served = `"${titleOf(html) || "(no title)"}"`;
    const head =
        `${site}: the app at ${website} is not serving this run's composition.\n` +
        `  ${page.path}\n` +
        `    this run's page:  ${page.pageId}${published ? "" : "   (no longer published)"}\n` +
        `    the path serves:  ${live ?? "nothing"}  ${served}\n`;

    if (!published) {
        throw new Error(
            head +
                `  This run has been superseded. A later composition of the same job took these paths\n` +
                `  and this run's pages were unpublished, so the site does not serve them — nothing is\n` +
                `  broken. Compare the run that is live, or compose this one again to make it live:\n` +
                `    pageCompositionPocComposePages(runId: "${map.runId}")`
        );
    }

    throw new Error(
        head +
            `  This run's page is still published, so two live pages claim this path and the other one\n` +
            `  is answering. Comparing against it would photograph the wrong composition.`
    );
};
