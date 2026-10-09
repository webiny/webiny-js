# Link destinations: current line, new wording, no line — design and predictions

Written before the run. Follows `prohibitions-result.md`: with "Do NOT invent image URLs" present, the
Footer's valueless `socialLinks` got `https://www.facebook.com` in 2 of 4 runs; without it, 0 of 2.
The obvious reading is that the line leads the model toward URLs by discussing them.

## Arms (dry-run, medium effort, re-clustered check run)

| Arm              | Prompt                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `link-current`   | the current line ("Do NOT invent image URLs…")                                            |
| `link-new`       | the current line removed, the candidate added ("A link this section shows with no destination in the list above keeps an empty destination (`""`)…") |
| `link-none`      | neither                                                                                  |

Components: the six with a valueless link prop where the line is shown — Footer (`socialLinks`), Site
Header (`menuToggle`), Hero Section (`primaryCta`, `secondaryCta`), the two Contact Forms
(`privacyPolicyLink`, `submitButton`; `sidebarLinks`) and Schedule Tour Form (`submitButton`). Footer
three repeats per arm, the others one: 24 runs, **about $4** (the Footer runs about $0.27 at medium,
the others about $0.12). Over the $3 named, by the Footer's repeats, where the effect is.

## Measure

URLs in the output that are not in the prompt (an invented destination), read in each output; an
empty destination or `#` is not invented. Image URLs too, for completeness (0 expected throughout).

## Predictions

1. `link-current`: an invented destination on the Footer in at least 1 of 3.
2. `link-none`: 0 or 1 of 3 on the Footer.
3. `link-new`: 0 of 3.

## Decision rule

Fewer lines wins a tie. **If `link-none` is at least as good as both, cut the line** (no reword). Ship
`link-new` only if it beats `link-none`. At this size only a clear difference counts; a tie at zero
cuts.
