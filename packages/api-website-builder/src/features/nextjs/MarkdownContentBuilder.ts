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
    build(joinWith?: string): string;
}

export class MarkdownContentBuilder implements IMarkdownContentBuilder {
    private sections: ISection[] = [];

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

        // Default: append to end
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

    build(joinWith = "\n"): string {
        return this.sections.map(s => s.content).join(joinWith);
    }
}
