import type { iBasicNode, iBuilderConfig } from "../../interface";
import { BuilderRenderer, type iBuilder } from "../../Modules/BuilderRenderer";
import type { TemplateHandler } from "../../Modules/TemplateRegistry";
import "./Accordion.css";

export type AccordionElementType =
  | "@accordion"
  | "@accordion>details"
  | "@accordion>details>summary"
  | "@accordion>details>content"
  | "@accordion>details>content>desc"

export interface iAccordionConfig extends iBuilderConfig<AccordionElementType> { }

export class AccordionBuilder implements iBuilder<AccordionElementType> {
  readonly builderId = "accordion";
  readonly name = "accordion";
  readonly stylesheet = "./Accordion.css";

  public config!: Required<iAccordionConfig>;

  readonly defaultTemplate: TemplateHandler<AccordionElementType> = this.template.bind(this);

  constructor(config: Partial<iAccordionConfig> = {}) {
    const defaultConfig: Required<iAccordionConfig> = {
      themeId: "default",
      selectors: {
        "@accordion": { tagName: "div", className: "accordion", isArray: true },
        "@accordion>details": { tagName: "details" },
        "@accordion>details>summary": { tagName: "summary" },
        "@accordion>details>content": { tagName: "div", className: "content" },
        "@accordion>details>content>desc": { tagName: "p", className: "desc" },
      },
      emit: () => { }
    }

    this.config = BuilderRenderer.resolveConfig<iAccordionConfig>(defaultConfig, config);
  }

  create(data: iBasicNode, _config: Partial<iAccordionConfig> = {}): HTMLElement {
    this.config = BuilderRenderer.resolveConfig<iAccordionConfig>(this.config, _config);

    const selector = this.config.selectors;
    // create Accordion
    const containerSel = selector["@accordion"]
    const accordionContainer = document.createElement(containerSel.tagName!);
    accordionContainer.className = containerSel.className!;

    (data.content as iBasicNode[]).forEach(item => {
      const detailsSel = selector["@accordion>details"]
      const details = document.createElement(detailsSel.tagName!);

      const summarySel = selector["@accordion>details>summary"]
      const summary = document.createElement(summarySel.tagName!);
      summary.textContent = item.title as string;

      const contentSel = selector["@accordion>details>content"]
      const content = document.createElement(contentSel.tagName!);
      content.className = contentSel.className!;

      const pSel = selector["@accordion>details>content>desc"]
      const p = document.createElement(pSel.tagName!);
      p.className = pSel.className!;
      p.textContent = item.description as string;
      content.appendChild(p);

      details.append(summary, content)

      accordionContainer.appendChild(details);
    })

    return accordionContainer;
  }

  public initialize(root: HTMLElement): void {
    console.log(`[Section Runtime Active] Section DOM tree with ID "${root.id}" successfully mounted and initialized.`);
  }

  protected resolvePayload(payload: iBasicNode): Partial<Record<AccordionElementType, any>> {
    const items = Array.isArray(payload.content) ? payload.content : [payload.content];
    console.log("Accordion resolvePayload", { items })
    return {
      "@accordion": items,
      "@accordion>details": {},
      "@accordion>details>summary": {},
      "@accordion>details>content": {},
      "@accordion>details>content>desc": {},
    }
  }

  protected template(typeKey: AccordionElementType, el: HTMLElement, payload: any, _selector: any): void {
    const selector = this.config.selectors[typeKey];

    if (typeKey === "@accordion") {
      console.log("@accordion", { payload })
    }

    if (typeKey === "@accordion>details") {
      console.log("@accordion>details", { payload })
    }

    if (typeKey === "@accordion>details>summary") {
      console.log("@accordion>details>summary", { payload })
    }

    if (typeKey === "@accordion>details>content") {
      console.log("@accordion>details>content", { payload })
    }

    if (typeKey === "@accordion>details>content>desc") {
      console.log("@accordion>details>content>desc", { payload })
    }
  }
}