import { describe, it, expect } from "vitest";
import { FormModel } from "./FormModel.js";
import { ConditionRuleEvaluator } from "./ConditionRuleEvaluator.js";
import type {
    IRule,
    IRuleEvaluator,
    ITabsNodeVM,
    IFormModel,
    IFormModelConfig
} from "./abstractions.js";

const condition = new ConditionRuleEvaluator();

function createForm(config: {
    extraEvaluators?: IRuleEvaluator[];
    fields: IFormModelConfig["fields"];
    layout?: IFormModelConfig["layout"];
}) {
    return new FormModel({
        fields: config.fields,
        layout: config.layout,
        ruleEvaluators: [condition, ...(config.extraEvaluators ?? [])]
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
                                operator: "eq",
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
                    layout.tabs({
                        id: "settings",
                        rules: [
                            {
                                type: "condition",
                                target: "trigger",
                                operator: "isEmpty",
                                value: null,
                                action: "disable"
                            }
                        ],
                        tabs: [
                            {
                                id: "general",
                                label: "General",
                                layout: [layout.row("general")]
                            },
                            {
                                id: "seo",
                                label: "SEO",
                                layout: [layout.row("seo")]
                            }
                        ]
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
                    layout.tabs({
                        id: "settings",
                        tabs: [
                            {
                                id: "general",
                                label: "General",
                                layout: [layout.row("general")]
                            },
                            {
                                id: "seo",
                                label: "SEO",
                                rules: [
                                    {
                                        type: "condition",
                                        target: "title",
                                        operator: "isEmpty",
                                        value: null,
                                        action: "disable"
                                    }
                                ],
                                layout: [layout.row("seo")]
                            }
                        ]
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
                    layout.tabs({
                        id: "settings",
                        tabs: [
                            {
                                id: "secret",
                                label: "Secret",
                                rules: [
                                    {
                                        type: "condition",
                                        target: "trigger",
                                        operator: "isEmpty",
                                        value: null,
                                        action: "hide"
                                    }
                                ],
                                layout: [layout.row("hiddenField")]
                            }
                        ]
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
                    layout.tabs({
                        id: "settings",
                        rules: [
                            {
                                type: "condition",
                                target: "trigger",
                                operator: "isEmpty",
                                value: null,
                                action: "hide"
                            }
                        ],
                        tabs: [
                            {
                                id: "tab1",
                                label: "Tab 1",
                                layout: [layout.row("inner")]
                            }
                        ]
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
            class AccessControlEvaluator implements IRuleEvaluator {
                constructor(private userTeams: string[]) {}
                canEvaluate(rule: IRule) {
                    return rule.type === "accessControl";
                }
                evaluate(rule: IRule): boolean {
                    if (!rule.value) {
                        return false;
                    }
                    const [scope, id] = rule.value.split(":");
                    return scope === "team" && this.userTeams.includes(id);
                }
            }

            const form = createForm({
                extraEvaluators: [new AccessControlEvaluator(["admins"])],
                fields: fields => ({
                    adminField: fields
                        .text()
                        .label("Admin Only")
                        .rules([
                            {
                                type: "accessControl",
                                target: "identity",
                                operator: "matches",
                                value: "team:admins",
                                action: "disable"
                            }
                        ])
                })
            });

            expect(form.field("adminField").vm.disabled).toBe(true);
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
                    operator: "eq",
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
    });
});
