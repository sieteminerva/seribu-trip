import type { iBasicNode } from "../interface";

export class AccordionBuilder {

  static create(content: iBasicNode[]): HTMLElement {

    // create Accordion
    const accordionContainer = document.createElement("div");
    accordionContainer.className = "accordion";

    content.forEach(item => {
      const details = document.createElement("details");

      const summary = document.createElement("summary");
      summary.textContent = item.title as string;

      const content = document.createElement("div");
      content.className = "content";

      const p = document.createElement("p");
      p.textContent = item.description as string;
      content.appendChild(p);

      details.append(summary, content)

      accordionContainer.appendChild(details);
    })

    return accordionContainer;
  }
}