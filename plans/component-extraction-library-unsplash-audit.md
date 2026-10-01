# Library audit: components carrying hardcoded Unsplash URLs

> Produced 2026-10-01. **Nothing has been deleted or changed.** This is the
> inventory for deciding whether these get a Replace pass, a deletion, or are left alone.

The component Library holds **212 components**. **49** of them embed hardcoded
`images.unsplash.com` URLs in their manifest `defaults.inputs` — **107 references to 74 distinct
images**. (109 raw occurrences, counting a URL repeated inside one component.)

These are not a rendering artefact. The model wrote them into the component source because the Plan
contract gave it no image values to use (see `image-values-are-captured-and-never-derived`), Promote
bundled that source as-is, and the Library now serves them as the component defaults. Anyone placing
one of these gets stock photography until they replace every image by hand.

## Why there are so many

Promote defaults to **keep-both-with-a-rename** on a name collision (`uniqueName` → `(2)`, `(3)`, …).
Replace is an opt-in `promote.collision` override chosen per component. So every promotion of a run
adds a new copy rather than updating the old one, and the Unsplash URLs accumulate with them.

**Fixing the derivation does not clear any of these.** It changes what future promotions contain.

## 2424Tulane — 11 components, 27 URLs

| component                       | id                         | URLs |
| ------------------------------- | -------------------------- | ---- |
| Hero Banner (2)                 | `6ab548b2ec82480002e2bed1` | 1    |
| Hero banner with CTA            | `6aba2b8ec4c23500029a4252` | 1    |
| Hero Banner with CTA            | `6ab3dafaed3d280002cc0106` | 1    |
| Hero Intro Section              | `6ab548b3ec82480002e2bed2` | 2    |
| Hero Introduction Section       | `6aba2b8fc4c23500029a4253` | 2    |
| Image Gallery Section           | `6aba2b90c4c23500029a4256` | 4    |
| Image Gallery Showcase (2)      | `6ab2a03943f96b000273f7d3` | 4    |
| Image Gallery Showcase (3)      | `6ab548b4ec82480002e2bed4` | 3    |
| Neighborhood/Location Highlight | `6aba2b91c4c23500029a4259` | 4    |
| Property Intro Hero (3)         | `6ab3be09ae40b500028e887b` | 3    |
| Property Intro Hero (4)         | `6ab3dafbed3d280002cc0107` | 2    |

## 71WestlandApartments — 5 components, 8 URLs

| component               | id                         | URLs |
| ----------------------- | -------------------------- | ---- |
| Contact Section         | `6ab3d8905b1a150002379862` | 1    |
| Contact Section (2)     | `6aba2a402c1ee90002a60cd2` | 1    |
| Resident Portal CTA (3) | `6ab3d8905b1a150002379863` | 2    |
| Resident Portal CTA (4) | `6aba2a412c1ee90002a60cd3` | 1    |
| Welcome Hero Banner (2) | `6aba2a3f2c1ee90002a60cce` | 3    |

## FreehillStreetLofts — 5 components, 10 URLs

| component                                  | id                         | URLs |
| ------------------------------------------ | -------------------------- | ---- |
| Hero Banner                                | `6aba29d5ae14540002bbcd58` | 4    |
| Image Figure Block                         | `6ab2659398b9ca000248b223` | 1    |
| Image Panel                                | `6aba29d6ae14540002bbcd5b` | 1    |
| Image with Caption Block                   | `6ab3d61c3c51c40002a9aa56` | 1    |
| Property Intro Hero with Image Collage (2) | `6ab29c42e917fd00029a9d0e` | 3    |

## ParkcityPalace — 24 components, 54 URLs

| component                                                            | id                         | URLs |
| -------------------------------------------------------------------- | -------------------------- | ---- |
| Hero Banner                                                          | `6ab3d90c5b1a150002379879` | 1    |
| Hero Banner (2)                                                      | `6ab4e7047682940002dd2291` | 1    |
| Hero Banner (3)                                                      | `6ab6310c41d5d700026b9843` | 1    |
| Hero Banner (4)                                                      | `6ab648f674489a000240efd1` | 2    |
| Hero Banner (5)                                                      | `6aba2aa6673e5a000203f33c` | 1    |
| Hero Banner (6)                                                      | `6abe104c18c99a00021d713d` | 1    |
| Hero Banner (7)                                                      | `6abe17c2822c5700020af644` | 1    |
| Property Description                                                 | `6ab3d90c5b1a15000237987a` | 2    |
| Property Description (2)                                             | `6ab6310c41d5d700026b9844` | 3    |
| Property Description (3)                                             | `6ab648f674489a000240efd2` | 2    |
| Property Description (4)                                             | `6aba2aa6673e5a000203f33d` | 4    |
| Property Description (5)                                             | `6abe104d18c99a00021d713e` | 4    |
| Property Description (6)                                             | `6abe17c2822c5700020af645` | 2    |
| Property Highlights (Floor Plans, Amenities, Neighborhood)           | `6ab6310d41d5d700026b9845` | 3    |
| Property Highlights Grid                                             | `6abe17c3822c5700020af646` | 3    |
| Property Highlights Links                                            | `6ab3d90c5b1a15000237987b` | 3    |
| Property Highlights Links (2)                                        | `6ab4e7057682940002dd2292` | 3    |
| Property Highlights Links (3)                                        | `6aba2aa7673e5a000203f33e` | 3    |
| Property Highlights Links (Floor Plans, Amenities, Neighborhood)     | `6ab648f774489a000240efd3` | 3    |
| Property Highlights Links (Floor Plans, Amenities, Neighborhood) (2) | `6abe104e18c99a00021d713f` | 3    |
| Property Overview Content                                            | `6ab250152824c8000273b21d` | 3    |
| Resident Portal CTA                                                  | `6ab648f874489a000240efd5` | 1    |
| Resident Portal CTA (2)                                              | `6abe104f18c99a00021d7142` | 1    |
| Three-Column Feature Cards with Links                                | `6ab290422f9a0000020cdd84` | 3    |

## TheVibeApartments — 4 components, 8 URLs

| component                    | id                         | URLs |
| ---------------------------- | -------------------------- | ---- |
| Hero Statement               | `6ab51966a0150600024ac646` | 1    |
| Image Block                  | `6ab51961a0150600024ac63b` | 1    |
| Image Slideshow              | `6ab51962a0150600024ac63c` | 3    |
| Photo Gallery with View More | `6ab51967a0150600024ac64a` | 3    |

## Every URL, deduped

**74 distinct image URLs** across the 49 components:

- `https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80` — used by 7 components
- `https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80` — used by 5 components
- `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80` — used by 4 components
- `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80` — used by 4 components
- `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80` — used by 3 components
- `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80` — used by 3 components
- `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80` — used by 3 components
- `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80` — used by 3 components
- `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80` — used by 2 components
- `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1519821172144-4f87d85de2a1?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1548611716-3f5015bd3e26?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1000&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1600&auto=format&fit=crop` — used by 1 component
- `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop` — used by 1 component
- `https://images.unsplash.com/photo-1פ` — used by 1 component
- `https://images.unsplash.com/photo-1543342384-1f1350e27861?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600` — used by 1 component
- `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600` — used by 1 component
- `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1560184897-ae75f418493e?w=900&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1588392382834-a891154bca4d?auto=format&fit=crop&w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80` — used by 1 component
- `https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80` — used by 1 component
