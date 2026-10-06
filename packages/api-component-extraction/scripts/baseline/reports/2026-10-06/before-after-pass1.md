# Before and after: capture and crop fixes

Each site's earlier run (captured before the fixes) against its baseline run (after), on the pages both captured. Sections are matched across runs by identical box on the same page; each matched pair of crops is compared with a coarse greyscale difference used only to rank pairs for inspection.

| site | pages | matched sections | matched pairs that differ (>0.10) | sections below the screenshot, before / after | 1px crops, before / after | crops narrower than their section, before / after |
| --- | ---: | ---: | ---: | --- | --- | --- |
| www.parkcityplace.org | 8 | 46 | 11 | 0 / 0 | 0 / 0 | 0 of 46 / 0 of 46 |
| www.2424tulane.com | 11 | 59 | 5 | 0 / 0 | 0 / 0 | 0 of 71 / 0 of 72 |
| promo.freehillstreetlofts.com | 2 | 9 | 0 | 0 / 0 | 0 / 0 | 0 of 9 / 0 of 11 |
| thevibe-apts.com | 9 | 72 | 7 | 0 / 0 | 0 / 0 | 2 of 82 / 0 of 82 |
| www.71westlandapts.com | 10 | 44 | 7 | 0 / 0 | 0 / 0 | 0 of 44 / 0 of 54 |

The most different matched pairs per site (up to 3), to inspect by eye. A difference here can also be content that changed between the two captures — a rotated special, a new photo — so each needs looking at before it counts as drift.

- **www.parkcityplace.org** `/`, section at y=1410 (1440x698), difference 0.26: [before](evidence/www.parkcityplace.org/1---y1410-before.png) 1440x698 · [after](evidence/www.parkcityplace.org/1---y1410-after.png) 1440x698
- **www.parkcityplace.org** `/`, section at y=2885 (1440x713), difference 0.24: [before](evidence/www.parkcityplace.org/2---y2885-before.png) 1440x713 · [after](evidence/www.parkcityplace.org/2---y2885-after.png) 1440x713
- **www.parkcityplace.org** `/`, section at y=2108 (1440x777), difference 0.17: [before](evidence/www.parkcityplace.org/3---y2108-before.png) 1440x777 · [after](evidence/www.parkcityplace.org/3---y2108-after.png) 1440x777
- **www.2424tulane.com** `/apartments/la/new-orleans/photo-gallery`, section at y=930 (1440x849), difference 0.30: [before](evidence/www.2424tulane.com/1--apartments-la-new-orleans-photo-gallery-y930-before.png) 1440x849 · [after](evidence/www.2424tulane.com/1--apartments-la-new-orleans-photo-gallery-y930-after.png) 1440x849
- **www.2424tulane.com** `/apartments/la/new-orleans/amenities`, section at y=2151 (1440x690), difference 0.23: [before](evidence/www.2424tulane.com/2--apartments-la-new-orleans-amenities-y2151-before.png) 1440x690 · [after](evidence/www.2424tulane.com/2--apartments-la-new-orleans-amenities-y2151-after.png) 1440x690
- **www.2424tulane.com** `/`, section at y=2509 (1440x536), difference 0.22: [before](evidence/www.2424tulane.com/3---y2509-before.png) 1440x536 · [after](evidence/www.2424tulane.com/3---y2509-after.png) 1440x536
- **promo.freehillstreetlofts.com** `/`, section at y=2094 (1440x627), difference 0.05: [before](evidence/promo.freehillstreetlofts.com/1---y2094-before.png) 1440x627 · [after](evidence/promo.freehillstreetlofts.com/1---y2094-after.png) 1440x627
- **promo.freehillstreetlofts.com** `/apartments/tx/houston/privacy-policy`, section at y=448 (1440x3053), difference 0.04: [before](evidence/promo.freehillstreetlofts.com/2--apartments-tx-houston-privacy-policy-y448-before.png) 1440x3053 · [after](evidence/promo.freehillstreetlofts.com/2--apartments-tx-houston-privacy-policy-y448-after.png) 1440x3053
- **promo.freehillstreetlofts.com** `/apartments/tx/houston/privacy-policy`, section at y=3502 (1440x294), difference 0.00: [before](evidence/promo.freehillstreetlofts.com/3--apartments-tx-houston-privacy-policy-y3502-before.png) 1440x293 · [after](evidence/promo.freehillstreetlofts.com/3--apartments-tx-houston-privacy-policy-y3502-after.png) 1440x293
- **thevibe-apts.com** `/Gallery.aspx`, section at y=8267 (1440x432), difference 0.70: [before](evidence/thevibe-apts.com/1--Gallery-aspx-y8267-before.png) 1440x432 · [after](evidence/thevibe-apts.com/1--Gallery-aspx-y8267-after.png) 1440x432
- **thevibe-apts.com** `/Gallery.aspx`, section at y=9951 (1440x731), difference 0.53: [before](evidence/thevibe-apts.com/2--Gallery-aspx-y9951-before.png) 1440x730 · [after](evidence/thevibe-apts.com/2--Gallery-aspx-y9951-after.png) 1440x730
- **thevibe-apts.com** `/Gallery.aspx`, section at y=9264 (1400x531), difference 0.42: [before](evidence/thevibe-apts.com/3--Gallery-aspx-y9264-before.png) 1400x531 · [after](evidence/thevibe-apts.com/3--Gallery-aspx-y9264-after.png) 1400x531
- **www.71westlandapts.com** `/`, section at y=1783 (1440x469), difference 0.20: [before](evidence/www.71westlandapts.com/1---y1783-before.png) 1440x469 · [after](evidence/www.71westlandapts.com/1---y1783-after.png) 1440x469
- **www.71westlandapts.com** `/apartments/ma/boston/gallery`, section at y=2242 (1440x469), difference 0.20: [before](evidence/www.71westlandapts.com/2--apartments-ma-boston-gallery-y2242-before.png) 1440x469 · [after](evidence/www.71westlandapts.com/2--apartments-ma-boston-gallery-y2242-after.png) 1440x469
- **www.71westlandapts.com** `/apartments/ma/boston/floor-plans`, section at y=1875 (1440x469), difference 0.20: [before](evidence/www.71westlandapts.com/3--apartments-ma-boston-floor-plans-y1875-before.png) 1440x469 · [after](evidence/www.71westlandapts.com/3--apartments-ma-boston-floor-plans-y1875-after.png) 1440x469
