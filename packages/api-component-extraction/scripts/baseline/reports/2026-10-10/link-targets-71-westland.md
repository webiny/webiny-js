# Where 71 Westland's links go

Every link on the 71 Westland rehearsal site (the demo fallback), checked for its destination. The earlier
link measure (`2026-10-09/link-list-observed-values.md`) read labels only and missed every wrong target;
see "Correction" there.

**Site:** tenant `71westlandrehearsal202614962`, run `6ac902f361abbb0002c84963#0001`, opened through
"Open site" on the App Runner domain. All 10 pages.

## Method

- **Built side:** the HTML each page serves from the tenant. **Source side:** the DOM Capture stored for the
  same page, not a fresh fetch of the live site.
- **Each built link is compared with the source links on the same page.** Its label is its text, plus
  image alt, `aria-label` or `title`:
  - **right:** a source link has the same label and the same destination;
  - **wrong target:** a source link has the same label but goes elsewhere;
  - **no destination:** no `href`, or `href` of `""`, `","` or `"#"`;
  - **other:** neither the label nor the destination pairs up on the source. Each of these was judged by
    hand.
- **Corrections made before reporting:**
  - An empty `href` was first normalised to `/` and counted as a real target. It is now counted as "no
    destination".
  - The property cards render their name twice, so they missed the label match. They were checked by hand
    against the source: there they are image links to external sites.
- **Where a relative wrong `href` lands** was fetched. `857-557-0699` and `,` both resolve to the site's 404
  page, from every page.

## Result: 110 links, 62 right, 48 wrong or dead

42 match the source outright. The other 20 right ones are the footer's two social icons on every page,
judged by hand: their labels are reworded ("facebook" for "Visit Facebook page"), but they go to the
right places. The 48 are 31 wrong targets, 16 with no destination, and "Food".

| Link                                                                            | Where                        | Goes to                   | Should go to                                          | A live click                     |
| ------------------------------------------------------------------------------- | ---------------------------- | ------------------------- | ----------------------------------------------------- | -------------------------------- |
| **"View Floor Plans"**                                                          | home, hero button            | the Facebook page         | `/apartments/ma/boston/floor-plans`                   | **leaves the site for Facebook** |
| **Address "71 Westland Ave, Boston, MA 02115"**                                 | footer, every page           | `857-557-0699` (relative) | Google Maps                                           | **404 page**                     |
| **"71 Westland Apartments"** (property name)                                    | footer, every page           | `,` (relative)            | `/`                                                   | **404 page**                     |
| **"Food"** (map category tab)                                                   | location                     | `https://www.mapbox.com/` | not a link on the source (a tab)                      | **leaves the site for Mapbox**   |
| Phone "857-557-0699"                                                            | footer, every page           | Google Maps               | `tel:857-557-0699`                                    | opens Maps instead of dialling   |
| "Apply Now" (second header button)                                              | header, every page           | `/` (home)                | `/apartments/ma/boston/contact`                       | goes home                        |
| Property cards: 15-25 Hemenway, 64-70 Burbank, Burbank Gardens, Westland Avenue | home, "other properties" row | nothing (no `href`)       | each property's own site (`15-25hemenwayapts.com`, …) | nothing happens                  |
| "Community" (tab)                                                               | amenities, gallery           | `""`                      | not a link on the source (a tab)                      | reloads the page                 |

**Right, and safe to click:**

- in the header, "Schedule a Tour" and the menu's "Apply Now";
- in the footer, "Privacy Policy" and the social icons;
- "Please Call 857-557-0699" where it appears (4 pages);
- the intro's "studio, 1 and 2 bedroom" link to floor plans (home);
- on single pages: "Visit Facebook page", "Google this business", "Resident Portal", "Learn More", the
  contact email, and the phone on contact.

## What not to click live

1. "View Floor Plans" on the home page hero.
2. The footer's address and property name, on any page.
3. "Food" on the location page.

**Also not to show: the home page's intro paragraph.** It reads "Choose from our studio, 1 and 2 bedroom
studio, 1 and 2 bedroom": the rest of the sentence ("…apartments in Boston, Massachusetts, and have it all…")
is lost. The inline link was lifted out of its paragraph
(`ai-context/issues/inline-links-are-lifted-into-standalone-link-props.md`). Added 2026-10-10.

The phone number, the second "Apply Now" and the property cards are wrong but harmless: a Maps tab, the home
page, nothing.

## How far it reaches

- **This is one built site.** A fresh run on the day re-derives from the same capture, so the composition
  side repeats, but Plan re-proposes props each run and the slots can shift.
- **It is the same family as the wrong-slot issues** (`a-fifth-of-derived-props-show-another-slots-text.md`):
  a destination lands in the wrong slot ("View Floor Plans" takes the social link, the address takes the
  phone), or a value that is not a destination becomes one (`,`, the phone number).
- **The other four sites are unproven on targets.** Their "clean" result in the earlier measure is clean on
  labels only.
