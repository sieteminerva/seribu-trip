import type { iBasicNode } from "../lib/LandingPageBuilder/interface";
import type { LandingPageBuilder, iPageController } from "../lib/LandingPageBuilder/LandingPage";
import { FormSchemaTransformer } from "../lib/LandingPageBuilder/Utils/FormSchemaTransformer";

export class DashboardPage implements iPageController {
  readonly route = "dashboard";
  readonly name: string = "dashboard"
  builder: LandingPageBuilder;

  constructor(
    Builder: LandingPageBuilder
  ) {
    this.builder = Builder;
  }

  // Hook onPrepare: dipanggil oleh LandingPageBuilder sebelum merender rute 'dashboard'
  async onPrepare(context: any) {
    // Ambil sub-route (nama halaman yang ingin diedit) dari pending fragment, default ke 'home'
    const targetSubRoute = (this.builder.pendingFragment || "home").toLowerCase();


    // Ambil data asli halaman tersebut dari pages registry
    const originalPageContent = context.pages[targetSubRoute] || [];

    // console.log({ targetSubRoute, originalPageContent })

    // Transform konten halaman asli menjadi form dashboard

    context.pages = this.content(originalPageContent).pages;
    context.menu = this.attachMenu(context.menu);

    if (targetSubRoute === "settings") {
      context.pages = this.createSettingsForm()
    }

    return context;
  }

  // Hook onReady: dipanggil setelah elemen dashboard selesai dirender di DOM
  onReady(elements: Map<string, HTMLElement>, shell: HTMLElement) {
    console.log("[Dashboard] Page DOM is ready", elements, shell);
  }

  // Hook onDestroy: dipanggil saat berpindah dari rute 'dashboard'
  onDestroy() {
    console.log("[Dashboard] Cleaning up and destroying page...");
  }

  content(PageContent: iBasicNode[]) {
    const injectionRules = [
      { selector: "p.eyebrow", inputType: "text" },
      { selector: "h2.title", inputType: "text" },
      { selector: "p.description", inputType: "textarea" },
      { selector: ".rating", inputType: "text" },
      { selector: "img", inputType: "file" },
      // 💡 JEMBATAN BARU: Tambahkan aturan agar scanner mendeteksi komponen kompleks otomatis!
      { property: "image", inputType: "file" },
      { property: "title", inputType: "text" },
      { property: "description", inputType: "textarea" },
      { property: "src", inputType: "file" }
    ];

    const reverseNode = FormSchemaTransformer.toFormNode(PageContent, injectionRules);
    // console.log({ reverseNode })

    const tabMenu: string[] = [];
    const tabBody: any[] = [];
    for (const node of reverseNode) {
      const m = node.legend.replace("Panel: ", "").replace("_", " ")
      tabMenu.push(m);
      tabBody.push({ builder: "form", content: [node] });
    }

    const x = {
      nodes: reverseNode,
      pages: [{
        id: "dashboard-tab",
        builder: "tab",
        content: {
          menu: tabMenu,
          body: tabBody
        }
      }]
    }
    // console.log({ x })
    return x;
  }

  public attachMenu(menuNode: iBasicNode) {
    const name = "dashboard";
    if (!menuNode.content.actions) {
      menuNode.content.actions = []
    }
    const item = {
      href: `#${name}`,
      title: "Admin Dashboard",
      icon: "user settings icon",
      attrs: {
        style: "width:1.8rem; height:1.8rem;"
      },
      onClick: (e: Event) => {
        e.preventDefault()
        let sidebar = document.querySelector(`.sidebar`)
        const app = document.querySelector("#app")
        if (!sidebar) {
          try {
            sidebar = this.createSidebar(menuNode)!
            document.body.prepend(sidebar!);
            app?.classList.add("squeeze")
          } catch (error) {
            console.warn("sidebar not found")
          }
        } else {
          sidebar.classList.toggle("hidden")

          if (sidebar.classList.contains("hidden")) {
            app?.classList.remove("squeeze")
          } else {
            app?.classList.add("squeeze")
          }
        }
      }
    }
    // console.log(x)
    if (!menuNode.content.actions.some((link: any) => link.href === `#${name}`)) {
      menuNode.content.actions?.push(item)
    }

    return menuNode;
  }



  private createSidebar(menuNode: iBasicNode) {
    const name = "dashboard";
    // console.log(menuNode)
    const navigations = menuNode.content?.navigations
      .map((item: any) => {
        console.log(item)
        return {
          ...item,
          label: item.href !== "#home" ? item.label : "Home",
          href: item.href.replace("#", `#${name}/`)
        }
      })
      .filter((item: any) => item.label !== "FAQ" && item.label !== "Table")

    navigations.unshift({ label: "Settings", href: "#dashboard/settings", icon: "gear" })

    const nodes = {
      id: `${name}-sidebar`,
      className: "sidebar",
      builder: "menu",
      content: {
        config: {
          ...menuNode.content.config,
          selectors: { "@menu": { id: "dashboard-sidebar" } },
          type: "sidebar",
          defaultRoute: name,
          themeId: "default",
          // override navigation
          onNavigate: (href?: string): boolean => {
            console.log("[onNavigate]", href)
            const route = href?.split("/");
            this.builder.router.navigate(route?.[0] as string, this.builder.currentThemeId, route?.[1], true);
            return true;
          },
        },
        navigations
      }
    }

    return this.builder.component?.build("menu", nodes)
  }

  createSettingsForm() {
    console.log("[Creating Settings Form]")
    return [
      {
        builder: "form",
        content: [
          { type: "text", title: "nama usaha" },
          { type: "select", title: "jenis usaha" },
          {
            id: "group-address",
            legend: "Alamat",
            group: [
              { type: "textarea", title: "jalan" },
              {
                type: "select", title: "propinsi", config: { className: "loading", attributes: [{ name: "data-level", value: "propinsi" }] }
              },
              {
                type: "select", title: "kota", config: { attributes: [{ name: "data-level", value: "kota" }] }
              },
              {
                type: "select", title: "kecamatan", config: { attributes: [{ name: "data-level", value: "kecamatan" }] }
              },
              {
                type: "select", title: "kelurahan", config: { attributes: [{ name: "data-level", value: "kelurahan" }] }
              },
              {
                type: "text", title: "kodepos", config: { attributes: [{ name: "data-level", value: "kodepos" }] }
              }
            ]
          }
        ]
      }
    ]
  }
}