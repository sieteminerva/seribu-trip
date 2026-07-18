import type { iBasicNode, iBuilderConfig } from "../../interface";
import "./PricingCard.css";

export type PricingCardElementType =
  | "@row"
  | "@column"
  | "@card"
  | "@card>header"
  | "@card>header>eyebrow"
  | "@card>divider"
  | "@card>body"
  | "@card>body>features"
  | "@card>body>features>item"
  | "@card>actions"
  | "@card>actions>button"

interface iPricingCardConfig extends iBuilderConfig<PricingCardElementType> {
  // selectors: Record<PricingCardElementType, iActionProperty>;
}

export class PricingCardBuilder {

  private _config!: Required<iPricingCardConfig>

  constructor(_config: Partial<iPricingCardConfig>) {

  }

  get config() {
    return this._config;
  }

  set config(_config: Partial<iPricingCardConfig>) {
    const defaultConfig: Required<iPricingCardConfig> = {
      themeId: "default",
      emit: () => { },
      selectors: {
        "@row": { tagName: "div", className: "row" },
        "@column": { tagName: "div", className: "column" },
        "@card": { tagName: "div", className: "card" },
        "@card>header": { tagName: "div", className: "header" },
        "@card>header>eyebrow": { tagName: "div", className: "eyebrow" },
        "@card>divider": { tagName: "div", className: "devider" },
        "@card>body": { tagName: "div", className: "body" },
        "@card>body>features": { tagName: "div", className: "row", isArray: true },
        "@card>body>features>item": { tagName: "div", className: "item" },
        "@card>actions": { tagName: "div", className: "actions" },
        "@card>actions>button": { tagName: "button", className: "button" }
      },
    };

    this._config = { ...defaultConfig, ..._config, ...defaultConfig.selectors, ..._config.selectors };

  }

  static create(data: iBasicNode[], _config?: Partial<iPricingCardConfig>): HTMLElement {

    const section = document.createElement("div");
    section.className = "row";

    // console.log("PricingCardBuilder", { data })

    // Loop render structural items array
    data.forEach((item: any) => {
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
      // console.log("PricingCardBuilder", { item })

      item.body.forEach((feature: any) => {
        const li = document.createElement("li");
        li.className = "item"
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
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "actions";

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

        actionsDiv.append(btn);
        card.append(actionsDiv);
      }

      column.append(card);
      section.append(column);
    });

    return section;
  }
}