import type { iAccordionContent } from "../interface";


export class AccordionBuilder {

  static create(content: iAccordionContent): HTMLElement {
    const section = document.createElement('section');
    section.id = content.id as string;
    section.className = content.className as string || "section card";

    const items = Array.isArray(content.items) ? content.items : [content.items];

    const headData = items[0] || { eyebrow: '', title: '' };

    if (headData.eyebrow) {
      const eyebrow = document.createElement("p");
      eyebrow.className = "eyebrow"
    }

    const h2 = document.createElement("h2");
    h2.style.width = "100%";
    h2.style.textAlign = "center"
    h2.textContent = content.name || "Pertanyaan Populer (FAQ)"

    // create Accordion
    const accordionContainer = document.createElement("div");
    accordionContainer.className = "accordion";

    items.forEach(item => {
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

    section.append(h2, accordionContainer);

    return section;
  }
}