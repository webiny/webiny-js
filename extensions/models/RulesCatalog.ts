import { ModelFactory } from "webiny/api/cms/model";

/**
 * Exhaustive catalog of condition rules, used to verify rule evaluation in the entry form.
 *
 * Conventions:
 * - Controllers are labelled `C · ...`; subjects are labelled `Rxx <action>: <condition>`,
 *   so the label alone says when the field must be hidden or disabled.
 * - `$.x` targets resolve against the subject's parent (object, list item or template item).
 *   Other targets are absolute paths from the entry root.
 */
export const RULES_CATALOG_MODEL_ID = "rulesCatalog";

type RuleValue = string | number | boolean | null;

const rule = (action: "hide" | "disable", target: string, operator: string, value: RuleValue) => ({
    type: "condition" as const,
    target,
    operator,
    value,
    action
});

const hide = (target: string, operator: string, value: RuleValue = null) => [
    rule("hide", target, operator, value)
];

const disable = (target: string, operator: string, value: RuleValue = null) => [
    rule("disable", target, operator, value)
];

const SELECT_OPTIONS = [
    { label: "A", value: "a" },
    { label: "B", value: "b" },
    { label: "C", value: "c" }
];

const CTA_STYLE_OPTIONS = [
    { label: "Location", value: "location" },
    { label: "Standard", value: "standard" },
    { label: "Initiative", value: "initiative" }
];

const HOLIDAY_OPTIONS = [
    { label: "Christmas", value: "christmas" },
    { label: "New Year", value: "newYear" }
];

const HEADER_STYLE_OPTIONS = [
    { label: "Manual Entry", value: "manual" },
    { label: "Reference", value: "reference" }
];

class RulesCatalogImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: RULES_CATALOG_MODEL_ID,
                    name: "Rules Catalog",
                    group: "ungrouped"
                })
                .description("Catalog of condition rules across field types, nesting and lists.")
                .fields(fields => ({
                    title: fields.text().renderer("textInput").label("Title"),

                    // ---------------------------------------------------------------
                    // A. Root controllers and operators (absolute targets)
                    // ---------------------------------------------------------------
                    cText: fields.text().renderer("textInput").label("C · Text"),
                    cNum: fields.number().renderer("numberInput").label("C · Number"),
                    cBool: fields
                        .boolean()
                        .renderer("switch")
                        .label("C · Boolean")
                        .defaultValue(false),
                    cSelect: fields
                        .text()
                        .renderer("select")
                        .label("C · Select")
                        .predefinedValues(SELECT_OPTIONS),
                    cTags: fields.text().list().renderer("tags").label("C · Tags"),

                    r01: fields
                        .text()
                        .renderer("textInput")
                        .label('R01 hide: cText == "hide"')
                        .rules(hide("cText", "==", "hide")),
                    r02: fields
                        .text()
                        .renderer("textInput")
                        .label('R02 hide: cText != "show"')
                        .rules(hide("cText", "!=", "show")),
                    r03: fields
                        .text()
                        .renderer("textInput")
                        .label('R03 hide: cText contains "xx"')
                        .rules(hide("cText", "contains", "xx")),
                    r04: fields
                        .text()
                        .renderer("textInput")
                        .label('R04 hide: cText notContains "keep"')
                        .rules(hide("cText", "notContains", "keep")),
                    r05: fields
                        .text()
                        .renderer("textInput")
                        .label('R05 hide: cText startsWith "pre"')
                        .rules(hide("cText", "startsWith", "pre")),
                    r06: fields
                        .text()
                        .renderer("textInput")
                        .label('R06 hide: cText notStartsWith "go"')
                        .rules(hide("cText", "notStartsWith", "go")),
                    r07: fields
                        .text()
                        .renderer("textInput")
                        .label('R07 hide: cText endsWith "end"')
                        .rules(hide("cText", "endsWith", "end")),
                    r08: fields
                        .text()
                        .renderer("textInput")
                        .label('R08 hide: cText notEndsWith "ok"')
                        .rules(hide("cText", "notEndsWith", "ok")),
                    r09: fields
                        .text()
                        .renderer("textInput")
                        .label("R09 hide: cText isEmpty")
                        .rules(hide("cText", "isEmpty")),
                    r10: fields
                        .text()
                        .renderer("textInput")
                        .label("R10 hide: cText isNotEmpty")
                        .rules(hide("cText", "isNotEmpty")),
                    r11: fields
                        .text()
                        .renderer("textInput")
                        .label('R11 hide: cText matches "exact"')
                        .rules(hide("cText", "matches", "exact")),
                    r12: fields
                        .text()
                        .renderer("textInput")
                        .label('R12 hide: cText eq "alias"')
                        .rules(hide("cText", "eq", "alias")),
                    r13: fields
                        .text()
                        .renderer("textInput")
                        .label('R13 hide: cText neq "alias"')
                        .rules(hide("cText", "neq", "alias")),
                    r14: fields
                        .text()
                        .renderer("textInput")
                        .label('R14 disable: cText == "lock"')
                        .rules(disable("cText", "==", "lock")),
                    r15: fields
                        .text()
                        .renderer("textInput")
                        .label("R15 disable: cText isEmpty")
                        .rules(disable("cText", "isEmpty")),

                    r20: fields
                        .text()
                        .renderer("textInput")
                        .label("R20 hide: cNum > 10")
                        .rules(hide("cNum", ">", 10)),
                    r21: fields
                        .text()
                        .renderer("textInput")
                        .label("R21 hide: cNum < 0")
                        .rules(hide("cNum", "<", 0)),
                    r22: fields
                        .text()
                        .renderer("textInput")
                        .label("R22 hide: cNum >= 5")
                        .rules(hide("cNum", ">=", 5)),
                    r23: fields
                        .text()
                        .renderer("textInput")
                        .label("R23 hide: cNum <= 5")
                        .rules(hide("cNum", "<=", 5)),
                    r24: fields
                        .text()
                        .renderer("textInput")
                        .label("R24 hide: cNum gt 100")
                        .rules(hide("cNum", "gt", 100)),
                    r25: fields
                        .text()
                        .renderer("textInput")
                        .label("R25 hide: cNum == 7")
                        .rules(hide("cNum", "==", 7)),
                    r26: fields
                        .text()
                        .renderer("textInput")
                        .label("R26 disable: cNum gte 50")
                        .rules(disable("cNum", "gte", 50)),

                    r30: fields
                        .text()
                        .renderer("textInput")
                        .label("R30 hide: cBool == true")
                        .rules(hide("cBool", "==", true)),
                    r31: fields
                        .text()
                        .renderer("textInput")
                        .label("R31 hide: cBool != true")
                        .rules(hide("cBool", "!=", true)),
                    r32: fields
                        .text()
                        .renderer("textInput")
                        .label("R32 hide: cBool isTruthy")
                        .rules(hide("cBool", "isTruthy")),
                    r33: fields
                        .text()
                        .renderer("textInput")
                        .label("R33 hide: cBool isFalsy")
                        .rules(hide("cBool", "isFalsy")),
                    r34: fields
                        .text()
                        .renderer("textInput")
                        .label("R34 disable: cBool == false")
                        .rules(disable("cBool", "==", false)),

                    r40: fields
                        .text()
                        .renderer("textInput")
                        .label('R40 hide: cSelect == "a"')
                        .rules(hide("cSelect", "==", "a")),
                    r41: fields
                        .text()
                        .renderer("textInput")
                        .label('R41 hide: cSelect != "b"')
                        .rules(hide("cSelect", "!=", "b")),
                    r42: fields
                        .text()
                        .renderer("textInput")
                        .label("R42 hide: cSelect isEmpty")
                        .rules(hide("cSelect", "isEmpty")),
                    r45: fields
                        .text()
                        .renderer("textInput")
                        .label("R45 hide: cTags isEmpty")
                        .rules(hide("cTags", "isEmpty")),
                    r46: fields
                        .text()
                        .renderer("textInput")
                        .label('R46 hide: cTags contains "secret"')
                        .rules(hide("cTags", "contains", "secret")),

                    r50: fields
                        .text()
                        .renderer("textInput")
                        .label('R50 hide: cText == "multi" OR cNum == 99')
                        .rules([
                            rule("hide", "cText", "==", "multi"),
                            rule("hide", "cNum", "==", 99)
                        ]),
                    r51: fields
                        .text()
                        .renderer("textInput")
                        .label('R51 hide: cSelect == "a"; disable: cBool == true')
                        .rules([
                            rule("hide", "cSelect", "==", "a"),
                            rule("disable", "cBool", "==", true)
                        ]),

                    // Subject field types, all hidden when cSelect == "c".
                    r60: fields
                        .longText()
                        .renderer("textarea")
                        .label('R60 longText hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r61: fields
                        .number()
                        .renderer("numberInput")
                        .label('R61 number hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r62: fields
                        .boolean()
                        .renderer("switch")
                        .label('R62 boolean hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r63: fields
                        .datetime()
                        .renderer("dateTimeInput")
                        .label('R63 datetime hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r64: fields
                        .richText()
                        .renderer("lexicalEditor")
                        .label('R64 richText hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r65: fields
                        .text()
                        .list()
                        .renderer("tags")
                        .label('R65 tags hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r66: fields
                        .text()
                        .list()
                        .renderer("textInputs")
                        .label('R66 textInputs hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),
                    r67: fields
                        .uiAlert()
                        .label('R67 uiAlert hide: cSelect == "c"')
                        .alertType("info")
                        .rules(hide("cSelect", "==", "c")),
                    r68: fields
                        .uiSeparator()
                        .label('R68 uiSeparator hide: cSelect == "c"')
                        .rules(hide("cSelect", "==", "c")),

                    // ---------------------------------------------------------------
                    // B. Single objects
                    // ---------------------------------------------------------------
                    obj: fields
                        .object()
                        .renderer("objectAccordionSingle")
                        .label("B · Object")
                        .fields(o => ({
                            ctrl: o.text().renderer("textInput").label("C · B ctrl"),
                            r70: o
                                .text()
                                .renderer("textInput")
                                .label('R70 hide: $.ctrl == "x"')
                                .rules(hide("$.ctrl", "==", "x")),
                            r71: o
                                .text()
                                .renderer("textInput")
                                .label('R71 hide: obj.ctrl == "y"')
                                .rules(hide("obj.ctrl", "==", "y")),
                            r72: o
                                .text()
                                .renderer("textInput")
                                .label('R72 hide: cText == "obj"')
                                .rules(hide("cText", "==", "obj")),
                            r73: o
                                .text()
                                .renderer("textInput")
                                .label('R73 disable: $.ctrl == "lock"')
                                .rules(disable("$.ctrl", "==", "lock")),
                            inner: o
                                .object()
                                .renderer("objectAccordionSingle")
                                .label("B · Inner object")
                                .fields(i => ({
                                    ctrl2: i
                                        .text()
                                        .renderer("textInput")
                                        .label("C · B inner ctrl2"),
                                    r74: i
                                        .text()
                                        .renderer("textInput")
                                        .label('R74 hide: $.ctrl2 == "x"')
                                        .rules(hide("$.ctrl2", "==", "x")),
                                    r75: i
                                        .text()
                                        .renderer("textInput")
                                        .label('R75 hide: obj.inner.ctrl2 == "y"')
                                        .rules(hide("obj.inner.ctrl2", "==", "y")),
                                    r76: i
                                        .text()
                                        .renderer("textInput")
                                        .label('R76 hide: obj.ctrl == "z"')
                                        .rules(hide("obj.ctrl", "==", "z"))
                                }))
                                .layout([["ctrl2"], ["r74"], ["r75"], ["r76"]])
                        }))
                        .layout([["ctrl"], ["r70"], ["r71"], ["r72"], ["r73"], ["inner"]]),
                    objHidden: fields
                        .object()
                        .renderer("objectAccordionSingle")
                        .label('R77 object hide: cSelect == "b"')
                        .rules(hide("cSelect", "==", "b"))
                        .fields(o => ({
                            child: o
                                .text()
                                .renderer("textInput")
                                .label("R77 child (follows parent)")
                        }))
                        .layout([["child"]]),
                    pass: fields
                        .object()
                        .renderer("passthrough")
                        .label("B · Passthrough")
                        .fields(o => ({
                            ctrl: o.text().renderer("textInput").label("C · B pass ctrl"),
                            r78: o
                                .text()
                                .renderer("textInput")
                                .label('R78 hide: $.ctrl == "x" (passthrough)')
                                .rules(hide("$.ctrl", "==", "x"))
                        }))
                        .layout([["ctrl", "r78"]]),

                    // ---------------------------------------------------------------
                    // C. Object lists
                    // ---------------------------------------------------------------
                    items: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple")
                        .label("C · List")
                        .fields(o => ({
                            ctrl: o.text().renderer("textInput").label("C · C item ctrl"),
                            flag: o.boolean().renderer("switch").label("C · C item flag"),
                            r80: o
                                .text()
                                .renderer("textInput")
                                .label('R80 hide: $.ctrl == "x"')
                                .rules(hide("$.ctrl", "==", "x")),
                            r81: o
                                .text()
                                .renderer("textInput")
                                .label('R81 hide: $.ctrl != "show"')
                                .rules(hide("$.ctrl", "!=", "show")),
                            r82: o
                                .text()
                                .renderer("textInput")
                                .label('R82 hide: cText == "list"')
                                .rules(hide("cText", "==", "list")),
                            r83: o
                                .text()
                                .renderer("textInput")
                                .label("R83 disable: $.flag == true")
                                .rules(disable("$.flag", "==", true)),
                            sub: o
                                .object()
                                .list()
                                .renderer("objectAccordionMultiple")
                                .label("C · Sub list")
                                .fields(s => ({
                                    subCtrl: s.text().renderer("textInput").label("C · C sub ctrl"),
                                    r84: s
                                        .text()
                                        .renderer("textInput")
                                        .label('R84 hide: $.subCtrl == "x"')
                                        .rules(hide("$.subCtrl", "==", "x"))
                                }))
                                .layout([["subCtrl"], ["r84"]]),
                            meta: o
                                .object()
                                .renderer("objectAccordionSingle")
                                .label("C · Item meta")
                                .fields(m => ({
                                    metaCtrl: m
                                        .text()
                                        .renderer("textInput")
                                        .label("C · C meta ctrl"),
                                    r85: m
                                        .text()
                                        .renderer("textInput")
                                        .label('R85 hide: $.metaCtrl == "x"')
                                        .rules(hide("$.metaCtrl", "==", "x"))
                                }))
                                .layout([["metaCtrl"], ["r85"]])
                        }))
                        .layout([
                            ["ctrl", "flag"],
                            ["r80"],
                            ["r81"],
                            ["r82"],
                            ["r83"],
                            ["sub"],
                            ["meta"]
                        ]),
                    listHidden: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple")
                        .label('R86 list hide: cSelect == "b"')
                        .rules(hide("cSelect", "==", "b"))
                        .fields(o => ({
                            child: o.text().renderer("textInput").label("R86 child")
                        }))
                        .layout([["child"]]),

                    // ---------------------------------------------------------------
                    // D. Dynamic zone list (mirrors the client's Page model)
                    // ---------------------------------------------------------------
                    blocks: fields
                        .dynamicZone()
                        .list()
                        .renderer("dynamicZone")
                        .label("D · Blocks")
                        .rules(hide("cText", "==", "noblocks"))
                        .template("hero", {
                            name: "Hero",
                            gqlTypeName: "RulesCatalogHero",
                            fields: t => ({
                                ctaStyle: t
                                    .text()
                                    .renderer("dropdown")
                                    .label("C · D CTA Style")
                                    .predefinedValues(CTA_STYLE_OPTIONS),
                                r90: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R90 hide: $.ctaStyle == "initiative"')
                                    .rules(hide("$.ctaStyle", "==", "initiative")),
                                r91: t
                                    .object()
                                    .list()
                                    .renderer("objectAccordionMultiple")
                                    .label('R91 list hide: $.ctaStyle != "initiative"')
                                    .rules(hide("$.ctaStyle", "!=", "initiative"))
                                    .fields(c => ({
                                        url: c.text().renderer("textInput").label("R91 url")
                                    }))
                                    .layout([["url"]]),
                                r100: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R100 disable: $.ctaStyle == "location"')
                                    .rules(disable("$.ctaStyle", "==", "location"))
                            }),
                            layout: [["ctaStyle"], ["r90"], ["r91"], ["r100"]]
                        })
                        .template("heading", {
                            name: "Heading",
                            gqlTypeName: "RulesCatalogHeading",
                            fields: t => ({
                                headerStyle: t
                                    .text()
                                    .renderer("dropdown")
                                    .label("C · D Header Style")
                                    .predefinedValues(HEADER_STYLE_OPTIONS)
                                    .defaultValue("manual"),
                                r92: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R92 hide: $.headerStyle != "manual"')
                                    .rules(hide("$.headerStyle", "!=", "manual")),
                                r93: t
                                    .richText()
                                    .renderer("lexicalEditor")
                                    .label('R93 richText hide: $.headerStyle != "manual"')
                                    .rules(hide("$.headerStyle", "!=", "manual")),
                                r94: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R94 hide: $.headerStyle != "reference"')
                                    .rules(hide("$.headerStyle", "!=", "reference")),
                                r98: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R98 hide: cText == "dz"')
                                    .rules(hide("cText", "==", "dz"))
                            }),
                            layout: [["headerStyle"], ["r92"], ["r93"], ["r94"], ["r98"]]
                        })
                        .template("groups", {
                            name: "Groups",
                            gqlTypeName: "RulesCatalogGroups",
                            fields: t => ({
                                groups: t
                                    .object()
                                    .list()
                                    .renderer("objectAccordionMultiple")
                                    .label("D · Groups")
                                    .fields(g => ({
                                        headerStyle: g
                                            .text()
                                            .renderer("dropdown")
                                            .label("C · D group Header Style")
                                            .predefinedValues(HEADER_STYLE_OPTIONS)
                                            .defaultValue("manual"),
                                        r95: g
                                            .text()
                                            .renderer("textInput")
                                            .label('R95 hide: $.headerStyle != "manual"')
                                            .rules(hide("$.headerStyle", "!=", "manual")),
                                        classes: g
                                            .object()
                                            .list()
                                            .renderer("objectAccordionMultiple")
                                            .label("D · Classes")
                                            .fields(c => ({
                                                customCTA: c
                                                    .boolean()
                                                    .renderer("switch")
                                                    .label("C · D customCTA"),
                                                r96: c
                                                    .text()
                                                    .renderer("textInput")
                                                    .label("R96 hide: $.customCTA != true")
                                                    .rules(hide("$.customCTA", "!=", true))
                                            }))
                                            .layout([["customCTA"], ["r96"]])
                                    }))
                                    .layout([["headerStyle"], ["r95"], ["classes"]])
                            }),
                            layout: [["groups"]]
                        })
                        .template("nestedObject", {
                            name: "Nested Object",
                            gqlTypeName: "RulesCatalogNestedObject",
                            fields: t => ({
                                settings: t
                                    .object()
                                    .renderer("objectAccordionSingle")
                                    .label("D · Settings")
                                    .fields(s => ({
                                        sCtrl: s
                                            .text()
                                            .renderer("textInput")
                                            .label("C · D settings ctrl"),
                                        r97: s
                                            .text()
                                            .renderer("textInput")
                                            .label('R97 hide: $.sCtrl == "x"')
                                            .rules(hide("$.sCtrl", "==", "x"))
                                    }))
                                    .layout([["sCtrl"], ["r97"]])
                            }),
                            layout: [["settings"]]
                        })
                        .template("nestedZone", {
                            name: "Nested Zone",
                            gqlTypeName: "RulesCatalogNestedZone",
                            fields: t => ({
                                activity: t
                                    .dynamicZone()
                                    .renderer("dynamicZone")
                                    .label("D · Activity")
                                    .template("climbing", {
                                        name: "Climbing",
                                        gqlTypeName: "RulesCatalogNestedZoneClimbing",
                                        fields: a => ({
                                            climbCtrl: a
                                                .text()
                                                .renderer("textInput")
                                                .label("C · D climb ctrl"),
                                            r99: a
                                                .text()
                                                .renderer("textInput")
                                                .label('R99 hide: $.climbCtrl == "x"')
                                                .rules(hide("$.climbCtrl", "==", "x"))
                                        }),
                                        layout: [["climbCtrl"], ["r99"]]
                                    })
                            }),
                            layout: [["activity"]]
                        }),

                    // ---------------------------------------------------------------
                    // E. Single dynamic zone
                    // ---------------------------------------------------------------
                    single: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("E · Single zone")
                        .template("plain", {
                            name: "Plain",
                            gqlTypeName: "RulesCatalogSinglePlain",
                            fields: t => ({
                                ctrl: t.text().renderer("textInput").label("C · E ctrl"),
                                r110: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R110 hide: $.ctrl == "x"')
                                    .rules(hide("$.ctrl", "==", "x"))
                            }),
                            layout: [["ctrl"], ["r110"]]
                        })
                        .template("withList", {
                            name: "With List",
                            gqlTypeName: "RulesCatalogSingleWithList",
                            fields: t => ({
                                rows: t
                                    .object()
                                    .list()
                                    .renderer("objectAccordionMultiple")
                                    .label("E · Rows")
                                    .fields(r => ({
                                        rowCtrl: r
                                            .text()
                                            .renderer("textInput")
                                            .label("C · E row ctrl"),
                                        r111: r
                                            .text()
                                            .renderer("textInput")
                                            .label('R111 hide: $.rowCtrl == "x"')
                                            .rules(hide("$.rowCtrl", "==", "x"))
                                    }))
                                    .layout([["rowCtrl"], ["r111"]])
                            }),
                            layout: [["rows"]]
                        }),

                    // ---------------------------------------------------------------
                    // G. Renderer cardinality (client report: "t.map is not a function")
                    // ---------------------------------------------------------------
                    // `dateTimeInputs` is a list renderer on non-list fields; the form must
                    // fall back to the single-value date picker.
                    holidayHours: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple")
                        .label("G · Holiday Hours")
                        .fields(holidayFields => ({
                            holiday: holidayFields
                                .text()
                                .renderer("dropdown")
                                .label("Holiday")
                                .predefinedValues(HOLIDAY_OPTIONS)
                                .required("Holiday is required."),
                            openTime: holidayFields
                                .datetime()
                                .renderer("dateTimeInputs")
                                .label("Open Time")
                                .required("Open Time is required."),
                            closeTime: holidayFields
                                .datetime()
                                .renderer("dateTimeInputs")
                                .label("Close Time")
                                .required("Close Time is required.")
                        }))
                        .layout([["holiday"], ["openTime", "closeTime"]]),
                    // A list with a subtype must keep the list renderer.
                    closedDates: fields
                        .datetime()
                        .list()
                        .dateOnly()
                        .renderer("dateTimeInputs")
                        .label("G · Closed Dates (date list)"),

                    // ---------------------------------------------------------------
                    // F. Tabs
                    // ---------------------------------------------------------------
                    tabs: fields
                        .uiTabs()
                        .label("F · Tabs")
                        .tab("one", {
                            label: "Tab One",
                            fields: t => ({
                                r120: t
                                    .text()
                                    .renderer("textInput")
                                    .label('R120 hide: cText == "tabs"')
                                    .rules(hide("cText", "==", "tabs"))
                            }),
                            layout: [["r120"]]
                        })
                        .tab("two", {
                            label: 'R121 Tab Two hide: cSelect == "b"',
                            fields: t => ({
                                tabTwoField: t
                                    .text()
                                    .renderer("textInput")
                                    .label("R121 tab two field")
                            }),
                            layout: [["tabTwoField"]],
                            rules: hide("cSelect", "==", "b")
                        })
                        .rules(hide("cText", "==", "notabs"))
                }))
                .layout([
                    ["title"],
                    ["cText", "cNum"],
                    ["cBool", "cSelect"],
                    ["cTags"],
                    ["r01", "r02", "r03"],
                    ["r04", "r05", "r06"],
                    ["r07", "r08", "r09"],
                    ["r10", "r11", "r12"],
                    ["r13", "r14", "r15"],
                    ["r20", "r21", "r22"],
                    ["r23", "r24", "r25"],
                    ["r26"],
                    ["r30", "r31", "r32"],
                    ["r33", "r34"],
                    ["r40", "r41", "r42"],
                    ["r45", "r46"],
                    ["r50", "r51"],
                    ["r60"],
                    ["r61", "r62"],
                    ["r63"],
                    ["r64"],
                    ["r65"],
                    ["r66"],
                    ["r67"],
                    ["r68"],
                    ["obj"],
                    ["objHidden"],
                    ["pass"],
                    ["items"],
                    ["listHidden"],
                    ["blocks"],
                    ["single"],
                    ["holidayHours"],
                    ["closedDates"],
                    ["tabs"]
                ])
                .titleFieldId("title")
                .singularApiName("RulesCatalog")
                .pluralApiName("RulesCatalogs")
        ];
    }
}

export const RulesCatalog = ModelFactory.createImplementation({
    implementation: RulesCatalogImpl,
    dependencies: []
});
