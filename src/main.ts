import './style.css';
import './lib/LandingPageBuilder/Components/Form/Form.css'
import './overrides.css';

import { PackagePageContent, GalleryPageContent, HomePageContent, ProductPageContent, FormPageContent, BlogPageContent } from './content';
import { FooterBuilder } from './lib/LandingPageBuilder/Components/Footer/Footer';
import { MenuBuilder } from './lib/LandingPageBuilder/Components/Menu/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { CarouselBuilder } from './lib/LandingPageBuilder/Components/Carousel/Carousel';
import { AccordionBuilder } from './lib/LandingPageBuilder/Components/Accordion/Accordion';
import { PricingCardBuilder } from './lib/LandingPageBuilder/Components/PricingCard/PricingCard';
import { MasonryBuilder } from './lib/LandingPageBuilder/Components/Masonry/Masonry';
import { SectionBuilder } from './lib/LandingPageBuilder/Components/Section/Section';
import { FormBuilder } from './lib/LandingPageBuilder/Components/Form/Form';
import { DefaultTheme } from './lib/LandingPageBuilder/Themes/DefaultTheme';
import { HorizontalTheme } from './lib/LandingPageBuilder/Themes/HorizontalTheme';
import type { iBasicNode } from './lib/LandingPageBuilder/interface';
import { CyberpunkTheme } from './lib/LandingPageBuilder/Themes/CyberpunkTheme';
import { FabMenuBuilder } from './lib/LandingPageBuilder/Components/FabMenu/FabMenu';
import { ModalBuilder } from './lib/LandingPageBuilder/Components/Modal/Modal';
import { ModeSwitcherBuilder } from './lib/LandingPageBuilder/Components/ModeSwitcher/ModeSwitcher';
import { TabBuilder } from './lib/LandingPageBuilder/Components/Tab/Tab';
import { ProductGridBuilder } from './lib/LandingPageBuilder/Components/Product/ProductGrid';
import { ArticleBuilder } from './lib/LandingPageBuilder/Components/Article/Article';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {

  const menu: iBasicNode = {
    builder: "menu",
    isRoot: true,
    content: {
      id: "menu-section",
      actions: [
        { label: 'SeribuTrip', href: '#home' },
        { label: 'Paket Perjalanan', href: '#package' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'FAQ', href: '#faq-section' },
        { label: 'Merchandise', href: '#merchandise' },
        { label: 'Blog', href: '#blog' },
        { label: 'Admin', href: '#form' },
      ]
    }

  };

  const companyName = "Agen Wisata SeribuTrip";

  const footer: iBasicNode = {
    builder: "footer",
    isRoot: true,
    content: {
      id: 'contact-section',
      company: companyName,
      columns: [
        {
          title: companyName,
          description: 'Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.',
        },
        {
          title: "Kontak & Informasi",
          actions: [
            { label: 'email', href: 'halo@seributrip.id' },
            { label: 'phone', href: '+628123456789' },
            { label: 'address', href: 'Dermaga 16 Marina Ancol, Jakarta' },
          ]
        },
        //... tambahkan column lain jika perlu
      ]
    }
  };


  const builder = new LandingPageBuilder({
    menu,
    pages: {
      home: HomePageContent,
      package: PackagePageContent,
      gallery: GalleryPageContent,
      form: FormPageContent.page as any,
      merchandise: (ProductPageContent as any),
      blog: BlogPageContent as any // <= saya pakai awalan huruf besar sedangkan route di menu huruf kecil
    },
    footer
  }, {
    container: app,
    useMenu: true,
    useFooter: true,
    defaultRoute: 'home',
    theme: "default"
  });

  builder.component?.register("accordion", (data: any) => new AccordionBuilder().create(data))
    .register("form", (data: any) => {
      // console.log("main.ts", { data });
      return new FormBuilder().create(data)
    })
    .register("carousel", (data: any) => new CarouselBuilder().create(data))
    .register("pricing-card", (data: any) => new PricingCardBuilder().create(data))
    .register("masonry", (data: any) => new MasonryBuilder({ category: "category" }).create(data.content))
    .register("section", (data: any) => new SectionBuilder().create(data/* , { tagName: "section" } */))
    .register("menu", (data: any) => new MenuBuilder({
      themeId: builder.currentThemeId,
      // override navigation
      onNavigate: (href?: string): boolean => {

        builder.router.navigate(href as string, builder.currentThemeId);
        return true;
      },
      // attach event emitter
      emit: (event, payload) => builder.events.emit(event, payload as any)
    }).create(data.content))
    .register("footer", (data: any) => new FooterBuilder().create(data))
    .register("fab-menu", (data: any) => new FabMenuBuilder().create(data.content))
    .register("modal", (el: any) => new ModalBuilder().create(el as HTMLElement) as any)
    .register("mode-switcher", (data: any) => new ModeSwitcherBuilder().create(data))
    .register("tab", (data: any) => new TabBuilder({
      emit: (event, payload) => builder.events.emit(event, payload as any)
    }).create(data))
    .register("product-card-grid", (data: any) => {
      // console.log(data)
      return new ProductGridBuilder().create(data)
    })
    .register("article", (data: any) => {
      return new ArticleBuilder({
        navigate: (slug: string, themeId: string) => builder.router.navigate("blog", themeId || builder.currentThemeId, slug, true)
      }).create(data.content)
    })

  builder.theme?.register(new DefaultTheme())
    .register(new HorizontalTheme())
    .register(new CyberpunkTheme());

  builder.theme?.renderSwitcher({ position: "bottom-left", duration: 10000 });

  builder.render();

  builder.events.on("elementAdded", (data) => {
    if (data.builder === "menu" && data.type === "@menu>actions") {
      // console.log(data)
      data.element.appendChild(builder.component?.build("mode-switcher", {}))
    }
  });

  builder.events.on("elementChanged", (payload) => {
    if (payload.builder === "tab" && payload.type === "tab:changed") {
      const index = payload.data;
      const form = builder.component?.build("form", FormPageContent.nodes[index])
      // console.log("tabChanged:", payload, form)
      payload.element?.replaceChildren(form);
    }
  });

}


