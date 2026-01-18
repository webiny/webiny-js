export interface ISection {
    id: string;
    content: string;
}

export interface IPositionOptions {
    before?: string;
    after?: string;
}
export interface IMarkdownContentBuilder {
    add(id: string, text: string, position?: IPositionOptions): this;
    remove(id: string): this;
    replace(id: string, text: string): this;
    setVariable(key: string, value: string): this;
    setVariables(vars: Record<string, string>): this;
    getVariable(key: string): string | undefined;
    build(joinWith?: string): string;
}

export class MarkdownContentBuilder implements IMarkdownContentBuilder {
    private sections: ISection[] = [];
    private variables: Map<string, string> = new Map();

    add(id: string, markdown: string, position?: IPositionOptions): this {
        const section: ISection = { id, content: markdown };

        if (position?.before) {
            const index = this.sections.findIndex(s => s.id === position.before);
            if (index !== -1) {
                this.sections.splice(index, 0, section);
                return this;
            }
        }

        if (position?.after) {
            const index = this.sections.findIndex(s => s.id === position.after);
            if (index !== -1) {
                this.sections.splice(index + 1, 0, section);
                return this;
            }
        }

        this.sections.push(section);
        return this;
    }

    remove(id: string): this {
        this.sections = this.sections.filter(s => s.id !== id);
        return this;
    }

    replace(id: string, markdown: string): this {
        const section = this.sections.find(s => s.id === id);
        if (section) {
            section.content = markdown;
        }
        return this;
    }

    setVariable(key: string, value: string): this {
        this.variables.set(key, value);
        return this;
    }

    setVariables(vars: Record<string, string>): this {
        Object.entries(vars).forEach(([key, value]) => {
            this.variables.set(key, value);
        });
        return this;
    }

    getVariable(key: string): string | undefined {
        return this.variables.get(key);
    }

    private substituteVariables(text: string): string {
        let result = text;
        this.variables.forEach((value, key) => {
            const regex = new RegExp(`\\{${this.escapeRegex(key)}\\}`, "g");
            result = result.replace(regex, value);
        });
        return result;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    build(joinWith = "\n"): string {
        const content = this.sections.map(s => s.content).join(joinWith);
        return this.substituteVariables(content);
    }
}
