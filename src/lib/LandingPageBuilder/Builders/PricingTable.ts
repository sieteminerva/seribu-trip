import type { iPricingTableContent, iTableProperty } from "../interface";

export class PricingTableBuilder {
  static create(content: iPricingTableContent): HTMLElement {
    const section = document.createElement("section");
    section.className = "section";
    if (content.id) section.id = content.id;
    if (content.className) section.classList.add(...content.className.split(" "));

    // Main layout responsive section framework
    const pageContainer = document.createElement("div");
    pageContainer.className = "page";

    const row = document.createElement("div");
    row.className = "row stackable";

    // Loop render structural items array
    content.items.forEach((item: iTableProperty) => {
      const column = document.createElement("div");
      column.className = "column";

      const card = document.createElement("div");
      card.className = "card pricing-card";
      if (item.id) card.id = item.id;
      if (item.className) card.classList.add(...item.className.split(" "));

      // 1. Pricing Header Configuration
      const headerDiv = document.createElement("div");
      headerDiv.className = "pricing-header";

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
      bodyDiv.className = "pricing-body";

      const list = document.createElement("ul");
      list.className = "unstyled-list pricing-features";

      item.body.forEach((feature) => {
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
        footerDiv.className = "pricing-footer";

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
      row.append(column);
    });

    pageContainer.append(row);
    section.append(pageContainer);

    return section;
  }
}