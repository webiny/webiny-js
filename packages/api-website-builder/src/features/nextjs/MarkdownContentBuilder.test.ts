import { describe, it, expect, beforeEach, vi } from "vitest";
import { MarkdownContentBuilder } from "./MarkdownContentBuilder.js";

describe("MarkdownContentBuilder", () => {
    let builder: MarkdownContentBuilder;

    beforeEach(() => {
        builder = new MarkdownContentBuilder();
    });

    describe("add", () => {
        it("should add sections to the end by default", () => {
            builder.add("section1", "First section").add("section2", "Second section");

            expect(builder.build()).toBe("First section\nSecond section");
        });

        it("should add section before specified id", () => {
            builder
                .add("section1", "First")
                .add("section2", "Second")
                .add("section-middle", "Middle", { before: "section2" });

            expect(builder.build()).toBe("First\nMiddle\nSecond");
        });

        it("should add section after specified id", () => {
            builder
                .add("section1", "First")
                .add("section2", "Second")
                .add("section-middle", "Middle", { after: "section1" });

            expect(builder.build()).toBe("First\nMiddle\nSecond");
        });

        it("should append to end if before id not found", () => {
            builder.add("section1", "First").add("section2", "Second", { before: "non-existent" });

            expect(builder.build()).toBe("First\nSecond");
        });

        it("should append to end if after id not found", () => {
            builder.add("section1", "First").add("section2", "Second", { after: "non-existent" });

            expect(builder.build()).toBe("First\nSecond");
        });
    });

    describe("remove", () => {
        it("should remove section by id", () => {
            builder
                .add("section1", "First")
                .add("section2", "Second")
                .add("section3", "Third")
                .remove("section2");

            expect(builder.build()).toBe("First\nThird");
        });

        it("should handle removing non-existent id gracefully", () => {
            builder.add("section1", "First").remove("non-existent");

            expect(builder.build()).toBe("First");
        });

        it("should handle removing from empty builder", () => {
            builder.remove("section1");
            expect(builder.build()).toBe("");
        });
    });

    describe("replace", () => {
        it("should replace section content with string", () => {
            builder.add("section1", "Original content").replace("section1", "Replaced content");

            expect(builder.build()).toBe("Replaced content");
        });

        it("should replace section content with callback", () => {
            builder
                .add("section1", "Original content")
                .replace("section1", current => current.toUpperCase());

            expect(builder.build()).toBe("ORIGINAL CONTENT");
        });

        it("should pass current content to callback", () => {
            builder.add("section1", "Hello").replace("section1", current => `${current} World`);

            expect(builder.build()).toBe("Hello World");
        });

        it("should handle callback that transforms content", () => {
            builder
                .add("code", '```bash\necho "test"\n```')
                .replace("code", current => current.replace("bash", "javascript"));

            expect(builder.build()).toBe('```javascript\necho "test"\n```');
        });

        it("should handle callback returning empty string", () => {
            builder.add("section1", "Original").replace("section1", () => "");

            expect(builder.build()).toBe("");
        });

        it("should handle replacing non-existent id with callback gracefully", () => {
            builder
                .add("section1", "First")
                .replace("non-existent", current => current + " modified");

            expect(builder.build()).toBe("First");
        });

        it("should maintain section position when replacing with callback", () => {
            builder
                .add("section1", "First")
                .add("section2", "Second")
                .add("section3", "Third")
                .replace("section2", current => current.toUpperCase());

            expect(builder.build()).toBe("First\nSECOND\nThird");
        });
    });

    describe("complex scenarios with callbacks", () => {
        it("should support plugin decoration with transformations", () => {
            builder
                .setVariable("API_KEY", "wat_12345")
                .add("section1", "Key: {API_KEY}")
                .add("code", "```bash\nAPI_KEY={API_KEY}\n```");

            // Plugin adds warning to code section
            builder.replace("code", current => {
                return `⚠️ **Security Warning**: Keep this private!\n\n${current}`;
            });

            const result = builder.build();
            expect(result).toContain("Security Warning");
            expect(result).toContain("```bash");
        });

        it("should chain multiple replace operations", () => {
            builder
                .add("text", "hello world")
                .replace("text", s => s.toUpperCase())
                .replace("text", s => `**${s}**`)
                .replace("text", s => `${s}!!!`);

            expect(builder.build()).toBe("**HELLO WORLD**!!!");
        });
    });

    describe("variables", () => {
        it("should set and substitute single variable", () => {
            builder
                .setVariable("API_KEY", "wat_12345")
                .add("section1", "Your API key is {API_KEY}");

            expect(builder.build()).toBe("Your API key is wat_12345");
        });

        it("should set and substitute multiple variables", () => {
            builder
                .setVariables({
                    API_KEY: "wat_12345",
                    HOST: "https://api.example.com",
                    TENANT: "root"
                })
                .add("section1", "Key: {API_KEY}, Host: {HOST}, Tenant: {TENANT}");

            expect(builder.build()).toBe(
                "Key: wat_12345, Host: https://api.example.com, Tenant: root"
            );
        });

        it("should substitute variables in multiple sections", () => {
            builder
                .setVariable("API_KEY", "wat_12345")
                .add("section1", "Section 1: {API_KEY}")
                .add("section2", "Section 2: {API_KEY}");

            expect(builder.build()).toBe("Section 1: wat_12345\nSection 2: wat_12345");
        });

        it("should handle variable replacement in code blocks", () => {
            builder
                .setVariables({
                    API_KEY: "wat_12345",
                    HOST: "https://api.example.com"
                })
                .add("code", "```bash\nAPI_KEY={API_KEY}\nHOST={HOST}\n```");

            expect(builder.build()).toBe(
                "```bash\nAPI_KEY=wat_12345\nHOST=https://api.example.com\n```"
            );
        });

        it("should leave unmatched variables unchanged", () => {
            builder
                .setVariable("API_KEY", "wat_12345")
                .add("section1", "Key: {API_KEY}, Unknown: {UNKNOWN}");

            expect(builder.build()).toBe("Key: wat_12345, Unknown: {UNKNOWN}");
        });

        it("should handle variables with special regex characters", () => {
            builder
                .setVariable("VAR.NAME", "value1")
                .setVariable("VAR$NAME", "value2")
                .add("section1", "{VAR.NAME} and {VAR$NAME}");

            expect(builder.build()).toBe("value1 and value2");
        });

        it("should get variable value", () => {
            builder.setVariable("API_KEY", "wat_12345");
            expect(builder.getVariable("API_KEY")).toBe("wat_12345");
        });

        it("should return undefined for non-existent variable", () => {
            expect(builder.getVariable("NON_EXISTENT")).toBeUndefined();
        });

        it("should override variable when set multiple times", () => {
            builder
                .setVariable("API_KEY", "old_value")
                .setVariable("API_KEY", "new_value")
                .add("section1", "{API_KEY}");

            expect(builder.build()).toBe("new_value");
        });

        it("should handle multiple occurrences of same variable", () => {
            builder.setVariable("NAME", "John").add("section1", "Hello {NAME}, welcome {NAME}!");

            expect(builder.build()).toBe("Hello John, welcome John!");
        });
    });

    describe("build", () => {
        it("should use default newline separator", () => {
            builder.add("section1", "First").add("section2", "Second");

            expect(builder.build()).toBe("First\nSecond");
        });

        it("should use custom separator", () => {
            builder.add("section1", "First").add("section2", "Second");

            expect(builder.build("\n\n")).toBe("First\n\nSecond");
        });

        it("should return empty string for empty builder", () => {
            expect(builder.build()).toBe("");
        });

        it("should handle single section", () => {
            builder.add("section1", "Only section");
            expect(builder.build()).toBe("Only section");
        });
    });

    describe("method chaining", () => {
        it("should support fluent interface", () => {
            const result = builder
                .setVariable("NAME", "Test")
                .add("section1", "Hello {NAME}")
                .add("section2", "Second")
                .remove("section2")
                .add("section3", "Third")
                .replace("section3", "Replaced")
                .build();

            expect(result).toBe("Hello Test\nReplaced");
        });
    });

    describe("complex scenarios", () => {
        it("should handle Next.js config example", () => {
            const result = builder
                .setVariables({
                    API_KEY: "wat_12345678",
                    API_HOST: "https://example.cloudfront.net",
                    TENANT: "root"
                })
                .add("description", "This is a configuration for **Webiny Next.js starter kit**:")
                .add(
                    "env-vars",
                    "```bash\nNEXT_PUBLIC_WEBSITE_BUILDER_API_KEY={API_KEY}\nNEXT_PUBLIC_WEBSITE_BUILDER_API_HOST={API_HOST}\nNEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT={TENANT}\n```"
                )
                .build();

            expect(result).toContain("wat_12345678");
            expect(result).toContain("https://example.cloudfront.net");
            expect(result).toContain("root");
            expect(result).toContain("Webiny Next.js starter kit");
        });

        it("should support plugin decoration pattern", () => {
            // Initial builder
            builder.setVariable("API_KEY", "original_key").add("section1", "Key: {API_KEY}");

            // Plugin modifies
            builder
                .setVariable("API_KEY", "plugin_key")
                .add("plugin-section", "Added by plugin: {API_KEY}", { after: "section1" });

            const result = builder.build();
            expect(result).toBe("Key: plugin_key\nAdded by plugin: plugin_key");
        });
    });

    describe("deep variable interpolation", () => {
        it("should handle single level nested variables", () => {
            builder
                .setVariables({
                    LINK: "https://example.com",
                    DESCRIPTION: "Visit {LINK} for more info"
                })
                .add("section1", "{DESCRIPTION}");

            expect(builder.build()).toBe("Visit https://example.com for more info");
        });

        it("should handle multiple levels of nested variables", () => {
            builder
                .setVariables({
                    BASE_URL: "https://example.com",
                    API_PATH: "{BASE_URL}/api",
                    FULL_ENDPOINT: "{API_PATH}/v1/users"
                })
                .add("section1", "Endpoint: {FULL_ENDPOINT}");

            expect(builder.build()).toBe("Endpoint: https://example.com/api/v1/users");
        });

        it("should handle variables in HTML links", () => {
            builder
                .setVariables({
                    STARTER_KIT_LINK: "https://github.com/webiny/website-builder-nextjs",
                    DESCRIPTION:
                        '<a href="{STARTER_KIT_LINK}" target="_blank">Webiny Next.js starter kit</a>'
                })
                .add("section1", "{DESCRIPTION}");

            expect(builder.build()).toBe(
                '<a href="https://github.com/webiny/website-builder-nextjs" target="_blank">Webiny Next.js starter kit</a>'
            );
        });

        it("should handle complex nested scenario from example", () => {
            builder
                .setVariables({
                    DESCRIPTION:
                        'This is a configuration for <a href="{STARTER_KIT_LINK}" target="_blank">Webiny Next.js starter kit:</a>',
                    STARTER_KIT_LINK: "https://github.com/webiny/website-builder-nextjs",
                    API_TOKEN: "wat_12345",
                    API_HOST: "https://api.example.com",
                    ADMIN_HOST: "https://admin.example.com",
                    TENANT_ID: "root"
                })
                .add("description", "{DESCRIPTION}");

            const result = builder.build();
            expect(result).toContain("https://github.com/webiny/website-builder-nextjs");
            expect(result).toContain("Webiny Next.js starter kit");
            expect(result).not.toContain("{STARTER_KIT_LINK}");
        });

        it("should handle variable that references another variable multiple times", () => {
            builder
                .setVariables({
                    NAME: "John",
                    GREETING: "Hello {NAME}, welcome {NAME}!"
                })
                .add("section1", "{GREETING}");

            expect(builder.build()).toBe("Hello John, welcome John!");
        });

        it("should handle deep nesting (3+ levels)", () => {
            builder
                .setVariables({
                    LEVEL_1: "base",
                    LEVEL_2: "{LEVEL_1}/path",
                    LEVEL_3: "{LEVEL_2}/more",
                    LEVEL_4: "{LEVEL_3}/final"
                })
                .add("section1", "{LEVEL_4}");

            expect(builder.build()).toBe("base/path/more/final");
        });

        it("should handle circular references gracefully", () => {
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            builder
                .setVariables({
                    VAR_A: "Start {VAR_B}",
                    VAR_B: "{VAR_A} End"
                })
                .add("section1", "{VAR_A}");

            builder.build();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Maximum interpolation depth reached")
            );

            consoleSpy.mockRestore();
        });

        it("should stop at undefined variables and leave them as-is", () => {
            builder
                .setVariables({
                    DEFINED: "value",
                    HAS_UNDEFINED: "{DEFINED} and {UNDEFINED}"
                })
                .add("section1", "{HAS_UNDEFINED}");

            expect(builder.build()).toBe("value and {UNDEFINED}");
        });

        it("should handle mixed defined and nested variables", () => {
            builder
                .setVariables({
                    API_KEY: "key123",
                    HOST: "example.com",
                    CONFIG: "API_KEY={API_KEY}\nHOST={HOST}\nUNDEFINED={UNKNOWN}"
                })
                .add("section1", "{CONFIG}");

            const result = builder.build();
            expect(result).toContain("API_KEY=key123");
            expect(result).toContain("HOST=example.com");
            expect(result).toContain("UNDEFINED={UNKNOWN}");
        });
    });
});
