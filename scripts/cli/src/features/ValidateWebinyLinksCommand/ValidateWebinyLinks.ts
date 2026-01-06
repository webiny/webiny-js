import { UiService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

interface LinkInfo {
    url: string;
    file: string;
    line: number;
}

interface ValidationResult {
    url: string;
    valid: boolean;
    statusCode?: number;
    error?: string;
    locations: Array<{ file: string; line: number }>;
}

export class ValidateWebinyLinks {
    constructor(private ui: UiService.Interface) {}

    async execute(errorOnBrokenLinks: boolean): Promise<void> {
        this.ui.info("Scanning packages folder for webiny.link URLs...");
        this.ui.newLine();

        const packagesDir = path.join(process.cwd(), "packages");
        
        if (!fs.existsSync(packagesDir)) {
            this.ui.error("Packages directory not found at: %s", packagesDir);
            process.exit(1);
        }

        // Collect all webiny.link URLs
        const links = this.scanForLinks(packagesDir);
        
        if (links.length === 0) {
            this.ui.info("No webiny.link URLs found.");
            return;
        }

        this.ui.info("Found %s unique webiny.link URL(s)", links.size.toString());
        this.ui.newLine();

        // Validate each unique URL
        const results: ValidationResult[] = [];
        for (const [url, locations] of links) {
            const result = await this.validateUrl(url, locations);
            results.push(result);
        }

        // Display results
        this.displayResults(results);

        // Check if we should error on broken links
        const brokenLinks = results.filter(r => !r.valid);
        if (brokenLinks.length > 0 && errorOnBrokenLinks) {
            this.ui.newLine();
            this.ui.error("Found %s broken link(s). Exiting with error.", brokenLinks.length.toString());
            process.exit(1);
        }
    }

    private scanForLinks(dir: string): Map<string, LinkInfo[]> {
        const links = new Map<string, LinkInfo[]>();
        const webinyLinkRegex = /https?:\/\/webiny\.link\/[^\s\)">]*/g;

        const scanFile = (filePath: string) => {
            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const lines = content.split("\n");

                lines.forEach((line, index) => {
                    const matches = line.match(webinyLinkRegex);
                    if (matches) {
                        matches.forEach(url => {
                            if (!links.has(url)) {
                                links.set(url, []);
                            }
                            links.get(url)!.push({
                                url,
                                file: filePath,
                                line: index + 1
                            });
                        });
                    }
                });
            } catch (error) {
                // Skip files that can't be read (binary files, etc.)
            }
        };

        const scanDirectory = (dirPath: string) => {
            try {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);

                    // Skip node_modules, dist, build, .git, etc.
                    if (entry.name === "node_modules" || 
                        entry.name === "dist" || 
                        entry.name === "build" ||
                        entry.name === ".git" ||
                        entry.name === "coverage") {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (entry.isFile()) {
                        // Only scan text-based files
                        const ext = path.extname(entry.name).toLowerCase();
                        if ([".ts", ".tsx", ".js", ".jsx", ".md", ".txt", ".json", ".yaml", ".yml"].includes(ext)) {
                            scanFile(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories that can't be read
            }
        };

        scanDirectory(dir);
        return links;
    }

    private async validateUrl(url: string, locations: LinkInfo[]): Promise<ValidationResult> {
        return new Promise((resolve) => {
            const protocol = url.startsWith("https") ? https : http;
            
            const request = protocol.get(url, {
                timeout: 10000,
                headers: {
                    "User-Agent": "Webiny-Link-Validator/1.0"
                }
            }, (response) => {
                // Follow redirects
                if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    const redirectUrl = response.headers.location;
                    this.ui.debug("URL %s redirects to %s", url, redirectUrl);
                }

                const valid = response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 400;
                
                resolve({
                    url,
                    valid,
                    statusCode: response.statusCode,
                    locations: locations.map(l => ({ file: l.file, line: l.line }))
                });
            });

            request.on("error", (error) => {
                resolve({
                    url,
                    valid: false,
                    error: error.message,
                    locations: locations.map(l => ({ file: l.file, line: l.line }))
                });
            });

            request.on("timeout", () => {
                request.destroy();
                resolve({
                    url,
                    valid: false,
                    error: "Request timeout",
                    locations: locations.map(l => ({ file: l.file, line: l.line }))
                });
            });
        });
    }

    private displayResults(results: ValidationResult[]): void {
        const validLinks = results.filter(r => r.valid);
        const brokenLinks = results.filter(r => !r.valid);

        if (validLinks.length > 0) {
            this.ui.success("Valid links (%s):", validLinks.length.toString());
            validLinks.forEach(result => {
                this.ui.info("  ✓ %s (Status: %s)", result.url, result.statusCode?.toString() || "N/A");
                result.locations.forEach(loc => {
                    const relativePath = path.relative(process.cwd(), loc.file);
                    this.ui.debug("    - %s:%s", relativePath, loc.line.toString());
                });
            });
            this.ui.newLine();
        }

        if (brokenLinks.length > 0) {
            this.ui.warning("Broken links (%s):", brokenLinks.length.toString());
            brokenLinks.forEach(result => {
                const errorMsg = result.error || `Status: ${result.statusCode}`;
                this.ui.error("  ✗ %s (%s)", result.url, errorMsg);
                result.locations.forEach(loc => {
                    const relativePath = path.relative(process.cwd(), loc.file);
                    this.ui.debug("    - %s:%s", relativePath, loc.line.toString());
                });
            });
            this.ui.newLine();
        }

        // Summary
        this.ui.info("Summary: %s total, %s valid, %s broken", 
            results.length.toString(),
            validLinks.length.toString(),
            brokenLinks.length.toString()
        );
    }
}
