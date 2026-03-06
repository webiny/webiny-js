export default {
    printWidth: 100, // default: 80
    trailingComma: "none", // "none" | "all" | "es5"
    tabWidth: 2, // default: 2
    arrowParens: "avoid", // "always" | "avoid"
    endOfLine: "lf", // "lf" | "crlf" | "cr" | "auto"
    useTabs: false, // use tabs instead of spaces
    semi: true, // print semicolons; false to omit
    singleQuote: false, // use single quotes instead of double
    jsxSingleQuote: false, // use single quotes in JSX
    bracketSpacing: true, // spaces in object literals: { foo: bar }
    bracketSameLine: false, // put > of multiline JSX on last line (was jsxBracketSameLine)
    proseWrap: "preserve", // "always" | "never" | "preserve" — wrap markdown prose
    htmlWhitespaceSensitivity: "css", // "css" | "strict" | "ignore"
    vueIndentScriptAndStyle: false, // indent <script> and <style> in Vue files
    singleAttributePerLine: false, // enforce one JSX/HTML attribute per line
    embeddedLanguageFormatting: "auto", // "auto" | "off" — format embedded code (e.g. CSS-in-JS)
    quoteProps: "as-needed", // "as-needed" | "consistent" | "preserve" — object key quoting
    experimentalTernaries: false, // use "curious ternary" style (Prettier 3+)
    requirePragma: false, // only format files with @format pragma
    insertPragma: false, // insert @format pragma at top of formatted files
    rangeStart: 0, // format only a segment of the file (start offset)
    rangeEnd: Infinity, // format only a segment of the file (end offset)
    plugins: [], // list of plugin paths/modules
    overrides: [
        {
            files: ["*.js", "*.ts", "*.tsx"],
            options: {
                tabWidth: 4
            }
        }
    ]
};
