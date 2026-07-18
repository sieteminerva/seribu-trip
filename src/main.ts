import './style.css';
import './lib/LandingPageBuilder/Components/Form/Form.css'
import './overrides.css';

import { PackagePageContent, GalleryPageContent, HomePageContent } from './content';
import { FooterBuilder } from './lib/LandingPageBuilder/Components/Footer/Footer';
import { MenuBuilder } from './lib/LandingPageBuilder/Components/Menu/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { CarouselBuilder } from './lib/LandingPageBuilder/Components/Carousel/Carousel';
import { AccordionBuilder } from './lib/LandingPageBuilder/Components/Accordion/Accordion';
import { PricingCardBuilder } from './lib/LandingPageBuilder/Components/PricingCard/PricingCard';
import { MasonryBuilder } from './lib/LandingPageBuilder/Components/Masonry/Masonry';
import { SectionBuilder } from './lib/LandingPageBuilder/Components/Section/Section';
import { FormBuilder } from './lib/LandingPageBuilder/Components/Form/Form';
import { NodeTransformer } from './lib/LandingPageBuilder/Utils/NodeTransformer';
import { DefaultTheme } from './lib/LandingPageBuilder/Themes/DefaultTheme';
import { HorizontalTheme } from './lib/LandingPageBuilder/Themes/HorizontalTheme';
import type { iBasicNode } from './lib/LandingPageBuilder/interface';
import { CyberpunkTheme } from './lib/LandingPageBuilder/Themes/CyberpunkTheme';
import { FabMenuBuilder } from './lib/LandingPageBuilder/Components/FabMenu/FabMenu';
import { ModalBuilder } from './lib/LandingPageBuilder/Components/Modal/Modal';
import { ModeSwitcherBuilder } from './lib/LandingPageBuilder/Components/ModeSwitcher/ModeSwitcher';

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
        { label: 'Form', href: '#form' },
      ]
    }

  };

  const footer: iBasicNode = {
    builder: "footer",
    isRoot: true,
    content: {
      id: 'contact-section',
      title: 'Agen Wisata SeribuTrip',
      description: 'Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.',
      actions: [
        { label: 'email', href: 'halo@seributrip.id' },
        { label: 'phone', href: '+628123456789' },
        { label: 'address', href: 'Dermaga 16 Marina Ancol, Jakarta' },
      ]
    }

  };


  const injectionRules = [
    { selector: "p.eyebrow", inputType: "text" },
    { selector: "h2.title", inputType: "textarea" },
    { selector: "p.description", inputType: "textarea" },
    { selector: "img", inputType: "file" },
    // 💡 JEMBATAN BARU: Tambahkan aturan agar scanner mendeteksi komponen kompleks otomatis!
    { selector: ".compact", inputType: "textarea" }
  ];
  const reverseNode = NodeTransformer.toFormNode(HomePageContent, injectionRules);

  // console.log({ reverseNode });

  const builder = new LandingPageBuilder({
    menu,
    pages: {
      home: HomePageContent,
      package: PackagePageContent,
      gallery: GalleryPageContent,
      form: [
        {
          builder: "form",
          content: reverseNode,
        }
      ]
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
    .register("form", (data: any) => new FormBuilder().create(data.content))
    .register("carousel", (data: any) => new CarouselBuilder().create(data))
    .register("pricing-card", (data: any) => PricingCardBuilder.create(data.content))
    .register("masonry", (data: any) => new MasonryBuilder({ category: "category" }).create(data.content))
    .register("section", (data: any) => SectionBuilder.create(data, { tagName: "section" }))
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
    .register("footer", (data: any) => FooterBuilder.create(data))
    .register("fab-menu", (data: any) => new FabMenuBuilder().create(data.content))
    .register("modal", (el: any) => new ModalBuilder().create(el as HTMLElement) as any)
    .register("mode-switcher", (data: any) => new ModeSwitcherBuilder().create(data))

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

}


