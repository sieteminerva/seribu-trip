import { TabBuilder } from "../lib/LandingPageBuilder/Components/Tab/Tab";
import type { iBasicNode } from "../lib/LandingPageBuilder/interface";
import type { LandingPageBuilder } from "../lib/LandingPageBuilder/LandingPage";

export class ProposalPage {
  readonly route = "proposal";
  readonly name: string = "proposal"
  builder: LandingPageBuilder;

  constructor(Builder: LandingPageBuilder) {
    this.builder = Builder;
  }

  async onPrepare(context: any) {

    // Ambil sub-route (nama halaman yang ingin diedit) dari pending fragment, default ke 'home'
    // const targetSubRoute = (this.builder.currentRoute).toLowerCase();

    // Ambil data asli halaman tersebut dari pages registry
    const menu = context.menu;
    if (!(context.menu instanceof HTMLElement) && context.menu?.content) {
      context.menu = this.attachMenu(menu!);
    }

    // const originalPageContent = context.pages[targetSubRoute] || [];
    // console.log({ targetSubRoute, originalPageContent, menu: context.builder.menu })
    // console.log(context)
    context.pages = await this.content()
    return context;
  }

  attachMenu(menuNode: iBasicNode) {

    if (!menuNode.content.actions) {
      menuNode.content.actions = []
    }
    const item = {
      href: `#${this.name}`,
      title: "Proposal",
      label: "Proposal",
      attrs: {
        style: "margin-left: 1.3rem;"
      },
    }

    if (!menuNode.content.navigations.some((i: any) => i.href === `#${this.name}`)) {
      menuNode.content.navigations.push(item)
    }

    // console.log({ menuNode })
    return menuNode;
  }

  async content() {

    const tab = new TabBuilder({
      name: "tab-proposal",
      emit: (event, payload) => this.builder.events.emit(event, payload as any)
    })

    const tabEl = tab.create({
      menu: ["Proposal 1", "Proposal 2", "Porfolio"],
      body: [{}, {}, {}]
    })

    // console.log(container)
    return [
      {
        content: tabEl
      }
    ]
  }

  async onReady(elements: Map<string, HTMLElement>, shell: HTMLElement) {
    console.log("[Proposal] Page DOM is ready", elements, shell);


    this.builder.events.on("elementChanged", async (payload) => {
      if (payload.builder === "tab" && payload.type === "tab:changed" && payload.data.name === "tab-proposal") {
        const index = payload.data.index;
        const panelContent = await this.loadFile(`md/presentation${Number(index)}.md`)
        console.log("tab-proposal: changed")
        payload.element?.replaceChildren(panelContent);
      }
    })
  }

  async loadFile(path: string) {
    const container = document.createElement("div");
    const f = await fetch(path);
    const text = await f.text();

    const c = markdownToHtml(text);

    container.insertAdjacentHTML("afterbegin", c);
    return container;
  }
}

export function markdownToHtml(md: string) {
  let html = md;

  // Headings
  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Ordered lists
  html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ol>${m}</ol>`);

  // Unordered lists
  html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => {
    if (!m.startsWith('<ol>')) return `<ul>${m}</ul>`;
    return m;
  });

  // Paragraphs
  html = html.replace(/^(?!<(h\d|ul|ol|li|p|\/))(.*)$/gm, '<p>$2</p>');

  return html.trim();
}