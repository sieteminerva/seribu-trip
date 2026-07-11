import './style.css';
import './lib/LandingPageBuilder/Builders/Form.css'
import './lib/LandingPageBuilder/Builders/FileUploader.css';
import './lib/LandingPageBuilder/Themes/theme-switcher.css';
import './overrides.css';
import { createOrderModal } from './order-form';
import { createHomePageContent, createPackagePageContent, createGalleryPageContent } from './content';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { CarouselBuilder } from './lib/LandingPageBuilder/Builders/Carousel';
import { AccordionBuilder } from './lib/LandingPageBuilder/Builders/Accordion';
import { PricingCardBuilder } from './lib/LandingPageBuilder/Builders/PricingCard';
import { MasonryBuilder } from './lib/LandingPageBuilder/Builders/Masonry';
import { SectionBuilder } from './lib/LandingPageBuilder/Builders/Section';
import { BuilderRegistry } from './lib/LandingPageBuilder/BuilderRegistry';
import { FormBuilder } from './lib/LandingPageBuilder/Builders/Form';
import { NodeTransformer } from './lib/LandingPageBuilder/Utils/NodeTransformer';
import { ThemeRenderer } from './lib/LandingPageBuilder/Renderers/ThemeRenderer';
import { VerticalTheme, CyberpunkTheme } from './lib/LandingPageBuilder/Themes/test';
import { HorizontalTheme } from './lib/LandingPageBuilder/Themes/HorizontalTheme';
import type { iBasicNode } from './lib/LandingPageBuilder/interface';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const orderModal = createOrderModal();
  app.appendChild(orderModal.dialog);

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

  const homePageContent = createHomePageContent(() => orderModal.open());

  const injectionRules = [
    { selector: "p.eyebrow", inputType: "text" },
    { selector: "h2.title", inputType: "textarea" },
    { selector: "p.description", inputType: "textarea" },
    { selector: "img", inputType: "file" },
    // 💡 JEMBATAN BARU: Tambahkan aturan agar scanner mendeteksi komponen kompleks otomatis!
    { selector: ".compact", inputType: "textarea" } // Mengambil komponen accordion / carousel
  ];
  const reverseNode = NodeTransformer.toFormNode(homePageContent, injectionRules);

  console.log({ reverseNode });


  // Register Component Builder
  const builder = new BuilderRegistry()
    .register("accordion", (data) => AccordionBuilder.create(data))
    .register("carousel", (data: any) => new CarouselBuilder().create(data))
    .register("pricing-card", (data: any) => PricingCardBuilder.create(data))
    .register("masonry", (data: any) => new MasonryBuilder({ category: "category" }).create(data))
    .register("section", (data: any) => SectionBuilder.create(data, { tagName: "section" }))
    .register("form", (data: any) => new FormBuilder().create(data))
    .register("menu", (data: any) => MenuBuilder.create(data))
    .register("footer", (data: any) => ContactBuilder.create(data))


  const engine = new LandingPageBuilder({
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
    theme: "vertical"
  }, builder);


  // 3. Sambungkan ke ThemeRenderer dan aktifkan Switcher Melayang di posisi "bottom-left"
  const themeEngine = new ThemeRenderer(engine, "bottom-left")
    .registerTheme(VerticalTheme)
    .registerTheme(new HorizontalTheme())
    .registerTheme(CyberpunkTheme);

  if (themeEngine) {
    console.log("Registered Theme Ready to used")
  }

  engine.render();

  engine.events.on("onThemeChanged", (data) => {
    console.log(data)
  })
}


