# My Skills

This directory contains project-specific skills for the Webiny MCP server. Skills placed here are automatically discovered and served alongside the built-in skills.

## Adding a Skill

1. Create a folder with a kebab-case name:

   ```
   my-skills/<skill-name>/SKILL.md
   ```

2. Add YAML front-matter with `name` and `description`:

   ```markdown
   ---
   name: webiny-<skill-name>
   description: >
     What this skill covers and when to use it.
     Be specific -- this text is shown in the skill catalog.
   ---

   # Skill Title

   Your skill content here...
   ```

3. Restart your agent (it will automatically restart the MCP server). The skill will appear in `list_webiny_skills` automatically.

## Structure

```
my-skills/
├── README.md                          # This file
├── my-custom-skill/
│   └── SKILL.md                       # Discovered by MCP server
├── another-skill/
│   └── SKILL.md
└── ...
```

## Rules

- The file **must** be named `SKILL.md` (case-sensitive). Other `.md` files are ignored.
- Front-matter **must** include both `name` and `description`. Files missing either are skipped.
- The `name` field is used as the skill identifier in `get_webiny_skill`.
- To override a built-in skill, use the same `name` value -- project skills take priority.
- Folders can be nested. The server scans recursively for `SKILL.md` files.
