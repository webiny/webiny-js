import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "./feature.js";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import { ConditionRuleEvaluator } from "./ConditionRuleEvaluator.js";
import {
    FormModelFactory,
    type IRule,
    type IRuleEvaluator,
    type ITabsNodeVM,
    type IFormModel,
    type IFormModelConfig
} from "./abstractions.js";

function createForm(config: {
    extraEvaluators?: IRuleEvaluator[];
    fields: IFormModelConfig["fields"];
    layout?: IFormModelConfig["layout"];
}) {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    return container.resolve(FormModelFactory).create({
        fields: config.fields,
        layout: config.layout,
        ruleEvaluators: config.extraEvaluators
    });
}

describe("Rules system", () => {
    describe("condition rule on a field", () => {
        it("hides a field when its rule matches", () => {
            const form = createForm({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    subtitle: fields
                        .text()
                        .label("Subtitle")
                        .rules([
                            {
                                type: "condition",
                                target: "title",
                                operator: "isEmpty",
                                value: null,
                                action: "hide"
                            }
                        ])
                })
            });

            expect(form.field("subtitle").visible).toBe(false);
            expect(form.field("subtitle").vm.visible).toBe(false);

            form.field("title").setValue("Hello");
            expect(form.field("subtitle").visible).toBe(true);
            expect(form.field("subtitle").vm.visible).toBe(true);
        });

        it("disables a field when its rule matches", () => {
            const form = createForm({
                fields: fields => ({
                    country: fields.text().label("Country"),
                    city: fields
                        .text()
                        .label("City")
                        .rules([
                            {
                                type: "condition",
                                target: "country",
                                operator: "isEmpty",
                                value: null,
                                action: "disable"
                            }
                        ])
                })
            });

            expect(form.field("city").vm.disabled).toBe(true);

            form.field("country").setValue("US");
            expect(form.field("city").vm.disabled).toBe(false);
        });

        it("supports eq operator", () => {
            const form = createForm({
                fields: fields => ({
                    plan: fields.text().label("Plan"),
                    enterpriseOnly: fields
                        .text()
                        .label("Enterprise")
                        .rules([
                            {
                                type: "condition",
                                target: "plan",
                                operator: "==",
                                value: "enterprise",
                                action: "hide"
                            }
                        ])
                })
            });

            form.field("plan").setValue("starter");
            expect(form.field("enterpriseOnly").visible).toBe(true);

            form.field("plan").setValue("enterprise");
            expect(form.field("enterpriseOnly").visible).toBe(false);
        });

        it("excludes hidden fields from validation", async () => {
            const form = createForm({
                fields: fields => ({
                    toggle: fields.text().label("Toggle"),
                    required: fields
                        .text()
                        .label("Required")
                        .required("Must fill")
                        .rules([
                            {
                                type: "condition",
                                target: "toggle",
                                operator: "isEmpty",
                                value: null,
                                action: "hide"
                            }
                        ])
                })
            });

            // toggle is empty → "required" is hidden → should not count as invalid
            const valid = await form.validate();
            expect(valid).toBe(true);

            // Fill toggle → "required" becomes visible → fails without a value
            form.field("toggle").setValue("anything");
            const valid2 = await form.validate();
            expect(valid2).toBe(false);
            expect(form.errors.some(e => e.path === "required")).toBe(true);
        });
    });

    describe("rules on layout elements", () => {
        it("cascades disable from tabs container to contained fields", () => {
            const form = createForm({
                fields: fields => ({
                    trigger: fields.text().label("Trigger"),
                    general: fields.text().label("General"),
                    seo: fields.text().label("SEO")
                }),
                layout: layout => [
                    layout.row("trigger"),
                    layout
                        .tabs("settings")
                        .rules([
                            {
                                type: "condition",
                                target: "trigger",
                                operator: "isEmpty",
                                value: null,
                                action: "disable"
                            }
                        ])
                        .tab("general", tab => {
                            tab.label("General").layout(layout => [layout.row("general")]);
                        })
                        .tab("seo", tab => {
                            tab.label("SEO").layout(layout => [layout.row("seo")]);
                        })
                ]
            });

            expect(form.field("general").vm.disabled).toBe(true);
            expect(form.field("seo").vm.disabled).toBe(true);

            const tabs = form.vm.layout[1] as ITabsNodeVM;
            expect(tabs.disabled).toBe(true);
            expect(tabs.tabs[0].disabled).toBe(true);

            form.field("trigger").setValue("go");
            expect(form.field("general").vm.disabled).toBe(false);
            expect(form.field("seo").vm.disabled).toBe(false);
        });

        it("cascades disable from a single tab to its fields only", () => {
            const form = createForm({
                fields: fields => ({
                    title: fields.text().label("Title"),
                    general: fields.text().label("General"),
                    seo: fields.text().label("SEO")
                }),
                layout: layout => [
                    layout
                        .tabs("settings")
                        .tab("general", tab => {
                            tab.label("General").layout(layout => [layout.row("general")]);
                        })
                        .tab("seo", tab => {
                            tab.label("SEO")
                                .rules([
                                    {
                                        type: "condition",
                                        target: "title",
                                        operator: "isEmpty",
                                        value: null,
                                        action: "disable"
                                    }
                                ])
                                .layout(layout => [layout.row("seo")]);
                        })
                ]
            });

            expect(form.field("general").vm.disabled).toBe(false);
            expect(form.field("seo").vm.disabled).toBe(true);

            const tabs = form.vm.layout[0] as ITabsNodeVM;
            expect(tabs.tabs[0].disabled).toBe(false);
            expect(tabs.tabs[1].disabled).toBe(true);
        });

        it("hides a tab and its fields when the tab has a hide rule", async () => {
            const form = createForm({
                fields: fields => ({
                    trigger: fields.text().label("Trigger"),
                    hiddenField: fields.text().label("Hidden").required("needed")
                }),
                layout: layout => [
                    layout.row("trigger"),
                    layout.tabs("settings").tab("secret", tab => {
                        tab.label("Secret")
                            .rules([
                                {
                                    type: "condition",
                                    target: "trigger",
                                    operator: "isEmpty",
                                    value: null,
                                    action: "hide"
                                }
                            ])
                            .layout(layout => [layout.row("hiddenField")]);
                    })
                ]
            });

            // Tab is hidden → field inside is hidden → not validated
            const valid = await form.validate();
            expect(valid).toBe(true);

            // Form VM should not expose this tabs node (all tabs hidden = no tabs node)
            const tabsVm = form.vm.layout.find(n => n.type === "tabs");
            expect(tabsVm).toBeUndefined();
        });

        it("hides the entire tabs container when its rule matches", () => {
            const form = createForm({
                fields: fields => ({
                    trigger: fields.text().label("Trigger"),
                    inner: fields.text().label("Inner")
                }),
                layout: layout => [
                    layout.row("trigger"),
                    layout
                        .tabs("settings")
                        .rules([
                            {
                                type: "condition",
                                target: "trigger",
                                operator: "isEmpty",
                                value: null,
                                action: "hide"
                            }
                        ])
                        .tab("tab1", tab => {
                            tab.label("Tab 1").layout(layout => [layout.row("inner")]);
                        })
                ]
            });

            expect(form.vm.layout.find(n => n.type === "tabs")).toBeUndefined();
            expect(form.field("inner").visible).toBe(false);

            form.field("trigger").setValue("yes");
            expect(form.field("inner").visible).toBe(true);
            expect(form.vm.layout.find(n => n.type === "tabs")).toBeDefined();
        });
    });

    describe("custom rule evaluators", () => {
        it("uses externally registered evaluators for custom rule types", () => {
            class FeatureFlagEvaluator implements IRuleEvaluator {
                constructor(private enabledFlags: string[]) {}
                canEvaluate(rule: IRule) {
                    return rule.type === "featureFlag";
                }
                evaluate(rule: IRule): boolean {
                    return typeof rule.value === "string" && this.enabledFlags.includes(rule.value);
                }
            }

            const form = createForm({
                extraEvaluators: [new FeatureFlagEvaluator(["beta"])],
                fields: fields => ({
                    betaField: fields
                        .text()
                        .label("Beta Only")
                        .rules([
                            {
                                type: "featureFlag",
                                target: "flags",
                                operator: "matches",
                                value: "beta",
                                action: "disable"
                            }
                        ])
                })
            });

            expect(form.field("betaField").vm.disabled).toBe(true);
        });

        it("ignores rules with unknown types (no evaluator)", () => {
            const form = createForm({
                fields: fields => ({
                    weird: fields
                        .text()
                        .label("Weird")
                        .rules([
                            {
                                type: "bogusType",
                                target: "x",
                                operator: "noop",
                                value: null,
                                action: "hide"
                            }
                        ])
                })
            });

            // Unknown rule types are ignored — field remains visible
            expect(form.field("weird").visible).toBe(true);
            expect(form.field("weird").vm.disabled).toBe(false);
        });
    });

    describe("ConditionRuleEvaluator", () => {
        it("canEvaluate returns true only for condition rules", () => {
            const e = new ConditionRuleEvaluator();
            expect(
                e.canEvaluate({
                    type: "condition",
                    target: "x",
                    operator: "==",
                    value: "y",
                    action: "hide"
                })
            ).toBe(true);
            expect(
                e.canEvaluate({
                    type: "accessControl",
                    target: "identity",
                    operator: "matches",
                    value: "team:x",
                    action: "hide"
                })
            ).toBe(false);
        });

        it("isEmpty matches null, undefined, empty string, empty array", () => {
            const e = new ConditionRuleEvaluator();
            const mkForm = (value: unknown): IFormModel =>
                ({
                    field: () => ({ getValue: () => value })
                }) as unknown as IFormModel;

            const rule: IRule = {
                type: "condition",
                target: "x",
                operator: "isEmpty",
                value: null,
                action: "hide"
            };

            expect(e.evaluate(rule, mkForm(null))).toBe(true);
            expect(e.evaluate(rule, mkForm(undefined))).toBe(true);
            expect(e.evaluate(rule, mkForm(""))).toBe(true);
            expect(e.evaluate(rule, mkForm([]))).toBe(true);
            expect(e.evaluate(rule, mkForm("hello"))).toBe(false);
            expect(e.evaluate(rule, mkForm(0))).toBe(false);
        });

        describe("typed rule values", () => {
            const e = new ConditionRuleEvaluator();
            const mkForm = (value: unknown): IFormModel =>
                ({
                    field: () => ({ getValue: () => value })
                }) as unknown as IFormModel;
            const mkRule = (operator: string, value: IRule["value"]): IRule => ({
                type: "condition",
                target: "x",
                operator,
                value,
                action: "hide"
            });

            it.each([
                [false, false, true],
                [false, true, false],
                [true, true, true],
                [true, false, false]
            ])("== with boolean field %s and boolean rule value %s -> %s", (field, rule, out) => {
                expect(e.evaluate(mkRule("==", rule), mkForm(field))).toBe(out);
            });

            it.each([
                [false, false, false],
                [false, true, true],
                [true, true, false],
                [true, false, true]
            ])("!= with boolean field %s and boolean rule value %s -> %s", (field, rule, out) => {
                expect(e.evaluate(mkRule("!=", rule), mkForm(field))).toBe(out);
            });

            it("supports eq/neq aliases with boolean values", () => {
                expect(e.evaluate(mkRule("eq", false), mkForm(false))).toBe(true);
                expect(e.evaluate(mkRule("neq", false), mkForm(true))).toBe(true);
            });

            it("does not coerce strings to booleans", () => {
                expect(e.evaluate(mkRule("==", "false"), mkForm(false))).toBe(false);
                expect(e.evaluate(mkRule("==", "true"), mkForm(true))).toBe(false);
                expect(e.evaluate(mkRule("==", false), mkForm("false"))).toBe(false);
                expect(e.evaluate(mkRule("!=", "false"), mkForm(false))).toBe(true);
            });

            it("does not loosely match falsy values against booleans", () => {
                expect(e.evaluate(mkRule("==", ""), mkForm(false))).toBe(false);
                expect(e.evaluate(mkRule("==", 0), mkForm(false))).toBe(false);
                expect(e.evaluate(mkRule("==", false), mkForm(0))).toBe(false);
                expect(e.evaluate(mkRule("==", true), mkForm(1))).toBe(false);
            });

            it("compares plain strings as strings", () => {
                expect(e.evaluate(mkRule("==", "false"), mkForm("false"))).toBe(true);
                expect(e.evaluate(mkRule("==", "map"), mkForm("map"))).toBe(true);
                expect(e.evaluate(mkRule("!=", "map"), mkForm("other"))).toBe(true);
            });

            it("does not treat an empty field as false", () => {
                expect(e.evaluate(mkRule("==", false), mkForm(null))).toBe(false);
            });

            it("compares numbers with number and numeric string rule values", () => {
                expect(e.evaluate(mkRule("==", 5), mkForm(5))).toBe(true);
                expect(e.evaluate(mkRule("==", "5"), mkForm(5))).toBe(true);
                expect(e.evaluate(mkRule("!=", 5), mkForm(6))).toBe(true);
                expect(e.evaluate(mkRule(">", 5), mkForm(6))).toBe(true);
                expect(e.evaluate(mkRule("gte", 5), mkForm(5))).toBe(true);
                expect(e.evaluate(mkRule("<", 5), mkForm(6))).toBe(false);
                expect(e.evaluate(mkRule("lte", "5"), mkForm(4))).toBe(true);
            });
        });
    });

    describe("rules with typed values on layout elements", () => {
        const createAdvancedForm = (ruleValue: IRule["value"]) =>
            createForm({
                fields: fields => ({
                    advanced: fields.text().label("Advanced").defaultValue(false),
                    options: fields.text().label("Options"),
                    map: fields.text().label("Map")
                }),
                layout: layout => [
                    layout.row("advanced"),
                    layout
                        .tabs("tabs")
                        .rules([
                            {
                                type: "condition",
                                target: "advanced",
                                operator: "==",
                                value: ruleValue,
                                action: "hide"
                            }
                        ])
                        .tab("tab1", tab => {
                            tab.label("Tab 1").layout(layout => [layout.row("options")]);
                        })
                        .tab("tab2", tab => {
                            tab.label("Tab 2")
                                .rules([
                                    {
                                        type: "condition",
                                        target: "options",
                                        operator: "!=",
                                        value: "map",
                                        action: "disable"
                                    }
                                ])
                                .layout(layout => [layout.row("map")]);
                        })
                ]
            });

        const tabsVm = (form: IFormModel) =>
            form.vm.layout.find(n => n.type === "tabs") as ITabsNodeVM | undefined;

        it("hides tabs while a boolean field equals false", () => {
            const form = createAdvancedForm(false);

            expect(tabsVm(form)).toBeUndefined();
            expect(form.field("options").visible).toBe(false);

            form.field("advanced").setValue(true);
            expect(tabsVm(form)).toBeDefined();
            expect(form.field("options").visible).toBe(true);

            form.field("advanced").setValue(false);
            expect(tabsVm(form)).toBeUndefined();
        });

        it("disables a tab until its string condition stops matching", () => {
            const form = createAdvancedForm(false);
            form.field("advanced").setValue(true);

            expect(tabsVm(form)!.tabs[1].disabled).toBe(true);
            expect(form.field("map").vm.disabled).toBe(true);

            form.field("options").setValue("map");
            expect(tabsVm(form)!.tabs[1].disabled).toBe(false);
            expect(form.field("map").vm.disabled).toBe(false);
        });
    });
});

describe("disabled cascades into containers", () => {
    it("disables the children of a disabled object field", () => {
        const form = createForm({
            fields: fields => ({
                title: fields.text().label("Title"),
                meta: fields
                    .object()
                    .label("Meta")
                    .disabled()
                    .fields(inner => ({
                        source: inner.text().label("Source"),
                        comment: inner.text().label("Comment")
                    }))
            })
        });

        expect(form.field("meta").disabled).toBe(true);
        expect(form.field("meta.source").disabled).toBe(true);
        expect(form.field("meta.comment").disabled).toBe(true);
        expect(form.field("title").disabled).toBe(false);
    });

    it("reaches grandchildren of a disabled object field", () => {
        const form = createForm({
            fields: fields => ({
                outer: fields
                    .object()
                    .label("Outer")
                    .disabled()
                    .fields(inner => ({
                        nested: inner
                            .object()
                            .label("Nested")
                            .fields(deep => ({
                                value: deep.text().label("Value")
                            }))
                    }))
            })
        });

        expect(form.field("outer.nested").disabled).toBe(true);
        expect(form.field("outer.nested.value").disabled).toBe(true);
    });

    it("leaves children alone when the container is not disabled", () => {
        const form = createForm({
            fields: fields => ({
                meta: fields
                    .object()
                    .label("Meta")
                    .fields(inner => ({
                        source: inner.text().label("Source").disabled(),
                        comment: inner.text().label("Comment")
                    }))
            })
        });

        expect(form.field("meta").disabled).toBe(false);
        expect(form.field("meta.source").disabled).toBe(true);
        expect(form.field("meta.comment").disabled).toBe(false);
    });

    it("picks up a container disabled after the form was built", () => {
        const form = createForm({
            fields: fields => ({
                meta: fields
                    .object()
                    .label("Meta")
                    .fields(inner => ({
                        source: inner.text().label("Source")
                    }))
            })
        });

        expect(form.field("meta.source").disabled).toBe(false);
        form.field("meta").setDisabled(true);
        expect(form.field("meta.source").disabled).toBe(true);
    });
});
