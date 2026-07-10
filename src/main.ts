import './style.css';
import './form.css';
import './overrides.css';
import { createOrderModal } from './order-form';
import { createHomePageContent, createPackagePageContent, createGalleryPageContent } from './content';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { CarouselBuilder } from './lib/LandingPageBuilder/Builders/Carousel';
import { AccordionBuilder } from './lib/LandingPageBuilder/Builders/Accordion';
import { PricingTableBuilder } from './lib/LandingPageBuilder/Builders/PricingTable';
import { MasonryBuilder } from './lib/LandingPageBuilder/Builders/Masonry';
import { SectionBuilder } from './lib/LandingPageBuilder/Builders/Section';
import { BuilderRegistry } from './lib/LandingPageBuilder/BuilderRegistry';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const orderModal = createOrderModal();
  app.appendChild(orderModal.dialog);

  const menu = MenuBuilder.create({
    id: 'main-navigation',
    content: [
      { label: 'SeribuTrip', href: '#home' },
      { label: 'Paket Perjalanan', href: '#package' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'FAQ', href: '#faq-section' },
    ],
  });

  const footer = ContactBuilder.create({
    id: 'contact',
    title: 'Agen Wisata SeribuTrip',
    description: 'Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.',
    content: [
      { label: 'email', data: 'halo@seributrip.id' },
      { label: 'phone', data: '+628123456789' },
      { label: 'address', data: 'Dermaga 16 Marina Ancol, Jakarta' },
    ],
  });

  const homePageContent = createHomePageContent(() => orderModal.open());

  // Register Component Builder
  const builder = new BuilderRegistry()
    .register("accordion", (data) => AccordionBuilder.create(data))
    .register("carousel", (data: any) => new CarouselBuilder().create(data))
    .register("pricing-table", (data: any) => PricingTableBuilder.create(data))
    .register("masonry", (data: any) => new MasonryBuilder({ category: "category" }).create(data))
    .register("section", (data: any) => SectionBuilder.create(data, { tagName: "section" }))

  const engine = new LandingPageBuilder({
    menu,
    pages: {
      home: homePageContent,
      package: createPackagePageContent,
      gallery: createGalleryPageContent,
    },
    footer
  }, {
    container: app,
    useMenu: true,
    useFooter: true,
    defaultRoute: 'home',
  }, builder);

  engine.render();
}


