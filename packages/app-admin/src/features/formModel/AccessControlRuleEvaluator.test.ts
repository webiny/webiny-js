import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "./feature.js";
import { FormModelFactory, type IRule, type ITabsNodeVM } from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { Identity } from "~/domain/Identity.js";

const createIdentity = (id: string, teamSlugs: string[] = []) =>
    Identity.createAuthenticated({
        id,
        type: "admin",
        displayName: id,
        roles: [],
        teams: teamSlugs.map(slug => ({ id: `${slug}-id`, slug, name: slug })),
        permissions: [],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    } as Identity.Data);

const accessRule = (value: IRule["value"], action: IRule["action"] = "hide"): IRule => ({
    type: "accessControl",
    target: "identity",
    operator: "matches",
    value,
    action
});

const createContainer = (identity: Identity) => {
    const container = new Container();
    FormModelFeature.register(container);
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        setIdentity: () => {},
        clear: () => {}
    });
    return container;
};

const createFieldForm = (identity: Identity, rules: IRule[]) =>
    createContainer(identity)
        .resolve(FormModelFactory)
        .create({
            fields: fields => ({
                secret: fields.text().label("Secret").rules(rules)
            })
        });

describe("AccessControlRuleEvaluator", () => {
    it("hides a field from the admin the rule names", () => {
        const form = createFieldForm(createIdentity("user-1"), [accessRule("admin:user-1")]);

        expect(form.field("secret").visible).toBe(false);
    });

    it("leaves the field visible for other admins", () => {
        const form = createFieldForm(createIdentity("user-2"), [accessRule("admin:user-1")]);

        expect(form.field("secret").visible).toBe(true);
    });

    it("hides a field from members of the team the rule names, by team slug", () => {
        const form = createFieldForm(createIdentity("user-2", ["editors"]), [
            accessRule("team:editors")
        ]);

        expect(form.field("secret").visible).toBe(false);
    });

    it("leaves the field visible for admins outside the team", () => {
        const form = createFieldForm(createIdentity("user-2", ["writers"]), [
            accessRule("team:editors")
        ]);

        expect(form.field("secret").visible).toBe(true);
    });

    it("does not match a team by its id", () => {
        const form = createFieldForm(createIdentity("user-2", ["editors"]), [
            accessRule("team:editors-id")
        ]);

        expect(form.field("secret").visible).toBe(true);
    });

    it("disables the field for a viewer rule", () => {
        const form = createFieldForm(createIdentity("user-1"), [
            accessRule("admin:user-1", "disable")
        ]);

        expect(form.field("secret").visible).toBe(true);
        expect(form.field("secret").vm.disabled).toBe(true);
    });

    it("applies when any of several rules matches", () => {
        const form = createFieldForm(createIdentity("user-3", ["editors"]), [
            accessRule("admin:user-1"),
            accessRule("team:editors")
        ]);

        expect(form.field("secret").visible).toBe(false);
    });

    describe("read-only and no-access rules on one field", () => {
        const rules = [accessRule("admin:user-1", "disable"), accessRule("team:team-1", "hide")];

        it.each([
            ["matches only the read-only rule", "user-1", [], true, true],
            ["matches only the no-access rule", "user-2", ["team-1"], false, false],
            ["matches both rules", "user-1", ["team-1"], false, true],
            ["matches neither rule", "user-2", ["team-2"], true, false]
        ])("%s", (_, id, teams, visible, disabled) => {
            const form = createFieldForm(createIdentity(id, teams), rules);

            expect(form.field("secret").visible).toBe(visible);
            expect(form.field("secret").disabled).toBe(disabled);
        });
    });

    it("does not match an anonymous identity", () => {
        const form = createFieldForm(Identity.createAnonymous(), [accessRule("admin:anonymous")]);

        expect(form.field("secret").visible).toBe(true);
    });

    it.each([
        ["no scope", "user-1"],
        ["unknown scope", "role:user-1"],
        ["empty id", "admin:"],
        ["null", null],
        ["non-string", 1]
    ])("ignores a malformed value (%s)", (_, value) => {
        const form = createFieldForm(createIdentity("user-1"), [accessRule(value)]);

        expect(form.field("secret").visible).toBe(true);
    });

    it("hides a tab from the admin the rule names, alongside a condition rule", () => {
        const form = createContainer(createIdentity("user-1"))
            .resolve(FormModelFactory)
            .create({
                fields: fields => ({
                    options: fields.text().label("Options"),
                    map: fields.text().label("Map")
                }),
                layout: layout => [
                    layout
                        .tabs("tabs")
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
                                    },
                                    accessRule("admin:user-1")
                                ])
                                .layout(layout => [layout.row("map")]);
                        })
                ]
            });

        const tabs = form.vm.layout.find(n => n.type === "tabs") as ITabsNodeVM;
        expect(tabs.tabs.map(t => t.id)).toEqual(["tab1"]);
        expect(form.field("map").visible).toBe(false);
    });
});
