import './style.css';
import './lib/LandingPageBuilder/Components/Form.css'
import './overrides.css';

import { createHomePageContent, createPackagePageContent, createGalleryPageContent } from './content';
import { ContactBuilder } from './lib/LandingPageBuilder/Components/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Components/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { CarouselBuilder } from './lib/LandingPageBuilder/Components/Carousel';
import { AccordionBuilder } from './lib/LandingPageBuilder/Components/Accordion';
import { PricingCardBuilder } from './lib/LandingPageBuilder/Components/PricingCard';
import { MasonryBuilder } from './lib/LandingPageBuilder/Components/Masonry';
import { SectionBuilder } from './lib/LandingPageBuilder/Components/Section';
import { FormBuilder } from './lib/LandingPageBuilder/Components/Form';
import { NodeTransformer } from './lib/LandingPageBuilder/Utils/NodeTransformer';
import { DefaultTheme } from './lib/LandingPageBuilder/Themes/DefaultTheme';
import { HorizontalTheme } from './lib/LandingPageBuilder/Themes/HorizontalTheme';
import type { iBasicNode } from './lib/LandingPageBuilder/interface';
import { CyberpunkTheme } from './lib/LandingPageBuilder/Themes/CyberpunkTheme';
import { FabMenuBuilder } from './lib/LandingPageBuilder/Components/FabMenu';
import { ModalBuilder } from './lib/LandingPageBuilder/Components/Modal';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  // const orderModal = createOrderModal();
  // document.body.appendChild(orderModal.dialog);

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

  const homePageContent = createHomePageContent();

  const injectionRules = [
    { selector: "p.eyebrow", inputType: "text" },
    { selector: "h2.title", inputType: "textarea" },
    { selector: "p.description", inputType: "textarea" },
    { selector: "img", inputType: "file" },
    // 💡 JEMBATAN BARU: Tambahkan aturan agar scanner mendeteksi komponen kompleks otomatis!
    { selector: ".compact", inputType: "textarea" } // Mengambil komponen accordion / carousel
  ];
  const reverseNode = NodeTransformer.toFormNode(homePageContent, injectionRules);

  // console.log({ reverseNode });

  const builder = new LandingPageBuilder({
    menu,
    pages: {
      home: homePageContent,
      package: createPackagePageContent,
      gallery: createGalleryPageContent,
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

  builder.component?.register("accordion", (data: any) => AccordionBuilder.create(data))
    .register("form", (data: any) => new FormBuilder().create(data.content))
    .register("carousel", (data: any) => new CarouselBuilder().create(data))
    .register("pricing-card", (data: any) => PricingCardBuilder.create(data.content))
    .register("masonry", (data: any) => new MasonryBuilder({ category: "category" }).create(data.content))
    .register("section", (data: any) => SectionBuilder.create(data, { tagName: "section" }))
    .register("menu", (data: any) => MenuBuilder.create(data))
    .register("footer", (data: any) => ContactBuilder.create(data))
    .register("fab-menu", (data: any) => new FabMenuBuilder().create(data.content))
    .register("modal", (el: any) => new ModalBuilder().create(el as HTMLElement) as any)

  builder.theme?.register(new DefaultTheme())
    .register(new HorizontalTheme())
    .register(new CyberpunkTheme());

  builder.theme?.renderSwitcher({ position: "bottom-left", duration: 10000 });

  builder.render();

  builder.events.on("onThemeChanged", (data) => {
    if (data) { }
    // console.log(data)
  })
}


