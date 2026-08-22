import type { iBasicNode, iBuilderConfig } from "../../interface";
import { Builder } from "../Base";
import "./PricingCard.css";

export type PricingCardElementType =
  | "@container"
  | "@card"
  | "@card>header"
  | "@card>price"
  | "@card>divider"
  | "@card>body"
  | "@card>body>features"
  | "@card>body>features>item"
  | "@card>actions"

interface iPricingCardConfig extends iBuilderConfig<PricingCardElementType> {
  // selectors: Record<PricingCardElementType, iActionProperty>;
}

export class PricingCardBuilder extends Builder<PricingCardElementType, iPricingCardConfig> {
  readonly builderId = "pricing-card";
  readonly name = "pricing-card";
  readonly stylesheet = "./PricingCard.css";

  protected rawDataNode: any = null;

  constructor(config: Partial<iPricingCardConfig> = {}) {
    super();
    const defaultSelectors = {
      "@container": { tagName: "div", className: "row" },
      "@card": { tagName: "div", className: "card pricing", wrapper: ".column" },
      "@card>header": { tagName: "div", className: "header" },
      "@card>price": { tagName: "li", className: "item price-tag" },
      "@card>divider": { tagName: "hr", className: "divider" },
      "@card>body": { tagName: "div", className: "body" },
      "@card>body>features": { tagName: "ul", className: "features" },
      "@card>body>features>item": { tagName: "li", className: "item" },
      "@card>actions": { tagName: "div", className: "actions" },
    }

    const defaultConfig: Required<iPricingCardConfig> = {
      themeId: "default",
      namespace: null,
      emit: () => { },
      selectors: defaultSelectors,
    };

    this.config = this.resolveConfig(defaultConfig, config);

  }

  public prepare(data: iBasicNode, _config?: Partial<iBuilderConfig<PricingCardElementType>> | undefined): HTMLElement {

    const container = this.render("@container", data);
    const items = Array.isArray(data.content) ? data.content : [data.content];

    items.forEach((item: any) => {
      const card = this.render("@card", item) as { __outer: HTMLElement, __inner: HTMLElement };
      const header = this.render("@card>header", item);
      const divider = this.render("@card>divider", item);
      const body = this.render("@card>body", item);
      const features = this.render("@card>body>features", item);
      const price = this.render("@card>price", item.price)!
      for (const feature of item.body) {
        const li = this.render("@card>body>features>item", feature);
        features?.append(li!);
      }

      features?.appendChild(price)

      const actions = this.render("@card>actions", item);

      body?.appendChild(features!);

      card?.__inner.append(header!, divider!, body!, actions!);

      container?.append(card.__outer!)
    });

    return this.load("@container") as HTMLElement;
  }

  /**
   * PHASE 5: Attaches dynamic event interactions securely onto computed DOM paths.
   */
  public initialize(): void {
    const actionData = this.payload("@card>actions");
    if (actionData && actionData.onClick) {
      // TODO handle attach listeners
      const buttonElement = (this.load("@card>actions") as HTMLElement)?.firstChild;
      if (buttonElement) {
        buttonElement.addEventListener("click", actionData.onClick);
      }
    }
  }

  protected template(typeKey: PricingCardElementType, el: HTMLElement, payload: any): void {
    if (!payload) return;

    switch (typeKey) {
      case "@card":
        // console.log(typeKey, { payload, el })
        if (payload.className) el.classList.add(payload.className);
        break;

      case "@card>header":
        // console.log(typeKey, { payload, el })
        const eyebrow = document.createElement("span");
        eyebrow.textContent = payload.header;
        el.appendChild(eyebrow);
        break;

      case "@card>price":
        // console.log(typeKey, { payload, el })
        const currency = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          currencyDisplay: "symbol"
        })
        el.textContent = `Mulai dari ${currency.format(payload)} / pax`;
        break;

      case "@card>body>features":
        // console.log(typeKey, { payload, el })
        if (payload.disabled) el.classList.add("disabled");
        break;

      case "@card>body>features>item":
        // console.log(typeKey, { payload, el })
        el.textContent = payload.title;
        if (payload && payload.className) el.classList.add(payload.className);
        break;

      case "@card>actions":
        // console.log(typeKey, { payload, el })
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button";
        button.textContent = "Pilih"
        if (payload.className === "is-featured") {
          button.classList.add("primary");
        }
        el.appendChild(button);
        break;
    }
  }

  // private bindListeners() {

  // }
}