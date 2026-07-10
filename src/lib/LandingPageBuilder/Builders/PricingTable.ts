import type { iBasicNode } from "../interface";

export class PricingTableBuilder {
  static create(content: iBasicNode[]): HTMLElement {
    console.log(content)
    const section = document.createElement("div");
    section.className = "row";

    // Loop render structural items array
    content.forEach((item: any) => {
      const column = document.createElement("div");
      column.className = "column";

      const card = document.createElement("div");
      card.className = "card pricing";
      if (item.id) card.id = item.id;
      if (item.className) card.classList.add(...item.className.split(" "));

      // 1. Pricing Header Configuration
      const headerDiv = document.createElement("div");
      headerDiv.className = "header";

      const eyebrow = document.createElement("span");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = item.header;

      headerDiv.append(eyebrow);
      card.append(headerDiv);

      // 2. Component Layout Divider
      const divider = document.createElement("hr");
      divider.className = "divider";
      card.append(divider);

      // 3. Pricing Body / Feature Listing Loop
      const bodyDiv = document.createElement("div");
      bodyDiv.className = "body";

      const list = document.createElement("ul");
      list.className = "features";

      item.body.forEach((feature: any) => {
        const li = document.createElement("li");
        li.textContent = feature.name;
        if (feature.className) {
          li.classList.add(...feature.className.split(" "));
        }
        list.append(li);
      });

      bodyDiv.append(list);
      card.append(bodyDiv);

      // 4. Action Button Footer Handler
      if (item.action) {
        const footerDiv = document.createElement("div");
        footerDiv.className = "footer";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "button";
        btn.textContent = item.action.label || "Pilih Paket";

        // Dynamically style featured actions
        if (card.classList.contains("is-featured")) {
          btn.classList.add("primary");
        }

        // Apply custom action data tags or classes if available
        if (item.action.className) {
          btn.classList.add(...item.action.className.split(" "));
        }
        if (item.action.onClick) {
          btn.addEventListener("click", item.action.onClick);
        }

        footerDiv.append(btn);
        card.append(footerDiv);
      }

      column.append(card);
      section.append(column);
    });

    return section;
  }
}