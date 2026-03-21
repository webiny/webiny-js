/**
 * Discovery module — scans webiny package.json exports and barrel files
 * to find all exported abstractions claimed by plugins.
 */
import fs from "fs";
import path from "path";

/**
 * Simple glob matching for export path patterns.
 * Supports "**" to match any depth.
 */
function matchPattern(exportPath, pattern) {
  // Convert glob pattern to regex
  // Replace ** first with a placeholder, then * with single-segment match, then restore **
  var regexStr = pattern
    .replace(/\*\*/g, "\0GLOBSTAR\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0GLOBSTAR\0/g, ".*");
  regexStr = "^" + regexStr + "$";
  return new RegExp(regexStr).test(exportPath);
}

/**
 * Discover all exports from webiny barrel files that match registered plugins.
 */
export function discover(project, plugins, repoRoot) {
  var pkgJsonPath = path.join(repoRoot, "packages/webiny/package.json");
  var pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  var exports = Object.keys(pkgJson.exports || {});

  var results = [];

  for (var plugin of plugins) {
    // Filter export paths matching this plugin's patterns
    var matchingPaths = exports.filter(function(p) {
      return plugin.exportPathPatterns.some(function(pat) {
        return matchPattern(p, pat);
      });
    });

    for (var exportPath of matchingPaths) {
      // Derive layer from first segment: "./api/cms/entry" → "api"
      var segments = exportPath.split("/");
      var layer = segments[1]; // segments[0] is "."

      // Resolve source file: "./api/cms/entry" → "packages/webiny/src/api/cms/entry.ts"
      var srcRelative = exportPath.replace(/^\.\//, "");
      var srcPath = path.join(
        repoRoot,
        "packages/webiny/src",
        srcRelative + ".ts"
      );

      // Try to get the source file from the ts-morph project
      var sourceFile = project.getSourceFile(srcPath);
      if (!sourceFile) {
        // Try adding it
        try {
          sourceFile = project.addSourceFileAtPath(srcPath);
        } catch (e) {
          continue;
        }
      }
      if (!sourceFile) continue;

      // Scan all export declarations in the barrel file
      var exportDecls = sourceFile.getExportDeclarations();
      for (var exportDecl of exportDecls) {
        var namedExports = exportDecl.getNamedExports();
        var moduleSpec = exportDecl.getModuleSpecifierValue() || "";

        for (var ne of namedExports) {
          var name = ne.getName();
          if (plugin.matches(name)) {
            results.push({
              className: name,
              importPath: "webiny/" + srcRelative,
              sourceModuleSpecifier: moduleSpec,
              pluginId: plugin.id,
              layer: layer
            });
          }
        }
      }
    }
  }

  return results;
}
