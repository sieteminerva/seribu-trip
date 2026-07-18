import type { iBasicNode, iBuilderConfig } from "../../interface";
import "./Accordion.css";

export type AccordionElementType =
  | "@accordion"
  | "@accordion>details"
  | "@accordion>details>summary"
  | "@accordion>details>content"
  | "@accordion>details>content>desc"

export interface iAccordionConfig extends iBuilderConfig<AccordionElementType> { }

export class AccordionBuilder {

  public config!: Required<iAccordionConfig>;

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

    this.config = {
      ...defaultConfig,
      ...config,
      ...defaultConfig.selectors,
      ...config.selectors
    };
  }

  create(data: iBasicNode, _config: Partial<iAccordionConfig> = {}): HTMLElement {
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
}