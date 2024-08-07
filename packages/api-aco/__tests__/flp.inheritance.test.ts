describe("Folder Level Permissions -  Inheritance", () => {
    // Public folders.
    test.todo("folders without any permissions set on them are public");

    test.todo("if a folder has one or more custom permissions set, folder is no longer public");

    test.todo(
        "if a user has full access permissions (the `full-access` role), public folders should contain both public and full access permission in its permissions list"
    );

    test.todo(
        "if a child folder has one or more custom permissions set, child folder is no longer public, but parent folder remains public"
    );

    // Custom permissions and overrides.
    test.todo("if a folder has custom permissions, they should be also inherited by its children");

    test.todo(
        "if there are custom permissions that override inherited permissions of a folder, in its permissions list, we should see both inherited and custom permissions"
    );

    test.todo(
        "if a folder has an inherited permission and an override for it, in the child folder, we only see the override permission as the inherited permission"
    );

    test.todo(
        "if the 'public' permission is set on a child folder, it and all children should inherit it (until another override is set)"
    );

    test.todo(
        "if the 'no-access' permission is set on a child folder, it and all children should inherit it (until another override is set)"
    );

    // Teams
    test.todo(
        "if current user is receiving permissions from a team, the team permissions should be inherited by the folder"
    );

    test.todo(
        "if current user is receiving permissions from a team and direct assignment, the direct assignment should take precedence"
    );
});
