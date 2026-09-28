# Four sites' home pages all compose to `/`, and only the last one survives

> **Package:** `@webiny/api-page-composition-poc`
> **Severity:** medium — three of four migrated home pages are unreachable, and one site's compose
> silently overwrote another's. It is a composition defect, not a harness problem.

## What happens

`toPageIdentity` derives a Webiny path from a source URL, folding away the host. Every site's home
page therefore derives the same path:

```
/   parkcityplace   <- https://www.parkcityplace.org/
/   2424tulane      <- https://www.2424tulane.com/
/   71westland      <- https://www.71westlandapts.com/
/   freehill        <- https://promo.freehillstreetlofts.com/
```

Four separate Website Builder pages are created, each with its own id, all claiming `/`. Asking for
that path returns one of them — the one composed last:

```
/  ->  6aba2e621267410002c583f2#0001   "Houston, TX Apartments for Rent | Freehill Street Lofts"
```

So parkcityplace's, 2424tulane's and 71westland's home pages exist as records and are unreachable by
path. **28 of 31 composed pages are uniquely addressable; 3 are not.**

**Which three varies.** The winner is whichever run composed last, so re-composing in a different
order changes which home pages are reachable: freehill held `/` on one pass and 71westland on the
next, with nothing else about the runs changing. The defect is therefore not "three pages missing" —
it is that the set of reachable pages depends on run sequencing rather than on anything about the
sites. A report naming the missing pages is only true until the next compose.

Every other page escapes this only by accident: these sites happen to use host-specific prefixes like
`/apartments/la/new-orleans/…`, so their paths do not collide. A second site with `/contact` would
collide exactly the same way.

## Why it matters even though it looks like demo-environment noise

**It may not arise once each site is its own tenant**, and a real migration probably gives each
customer a tenant. But **it does arise in any shared tenant, which is what the demo environment is** —
so the thing shown to customers is the thing that has this defect.

The worse half is that it is silent. Compose reports success for all four runs. The page map for
parkcityplace records a `pageId` and a path, and nothing says that path now serves someone else's
page. A run can report a fully successful migration whose home page a visitor cannot reach.

## Fix sketch (not implemented)

Options, roughly in order of how much they change:

1. **Namespace the path per run or per job** when composing into a shared tenant — `/parkcityplace/…`
   — which makes every path unique and every page reachable, at the cost of paths that do not match
   the source site's.
2. **Detect the collision and report it.** Compose already knows every path it is about to create; a
   path already claimed by another run is knowable before the page is written, and belongs in the
   discard log beside the unmigrated links and images rather than being discovered in a browser.
3. **One tenant per site**, which removes the collision for real migrations and leaves the demo
   environment as the only place it appears.

(2) is worth doing whatever else is decided: the failure mode to avoid is not the collision, it is a
successful-looking run whose pages are not where it says they are.
