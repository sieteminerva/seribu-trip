import type { iBasicNode, iBuilderConfig } from "../../interface";
import { Builder } from "../Base";
import "./Accordion.css";

export type AccordionElementType =
  | "@container"
  | "@accordion"
  | "@accordion>title"
  | "@accordion>content"
  | "@accordion>content>desc"

export interface iAccordionConfig extends iBuilderConfig<AccordionElementType> { }

export class AccordionBuilder extends Builder<AccordionElementType, iAccordionConfig> {
  readonly builderId = "accordion";
  readonly name = "accordion";
  readonly stylesheet = "./Accordion.css";

  constructor(config: Partial<iAccordionConfig> = {}) {
    super();
    const defaultConfig: Required<iAccordionConfig> = {
      themeId: "default",
      selectors: {
        "@container": { tagName: "div", className: "accordion" },
        "@accordion": { tagName: "details" },
        "@accordion>title": { tagName: "summary" },
        "@accordion>content": { tagName: "div", className: "content" },
        "@accordion>content>desc": { tagName: "p", className: "desc" },
      },
      emit: () => { }
    }

    this.config = this.resolveConfig<iAccordionConfig>(defaultConfig, config);
  }

  public prepare(data: iBasicNode, _config?: Partial<iAccordionConfig>): HTMLElement {

    const container = this.render("@container");
    const items = Array.isArray(data.content) ? data.content : [data.content];

    items.forEach((item: any) => {
      const details = this.render("@accordion" as any, data, true);
      const summary = this.render("@accordion>title" as any, item, true);
      const content = this.render("@accordion>content", item, true);
      const desc = this.render("@accordion>content>desc", item, true);

      content?.appendChild(desc!);

      details!.append(summary!, content!);

      container!.append(details!);
    });

    return this.load("@container") as HTMLElement;
  }

  public initialize(): void {
    console.log(`[Section Runtime Active] Section DOM tree with ID successfully mounted and initialized.`);
  }

  protected template(typeKey: AccordionElementType, el: HTMLElement, payload?: any): void {
    if (!payload) return;

    switch (typeKey) {
      case "@accordion>title":
        el.textContent = payload.title || "Untitled Header";
        break;

      case "@accordion>content>desc":
        el.textContent = payload.description || "";
        break;

      // Pos selektor pembungkus murni (@container, @accordion, @content) 
      // dilewati secara pasif karena tag & kelasnya sudah otomatis di-inject di atas!
    }
  }
}