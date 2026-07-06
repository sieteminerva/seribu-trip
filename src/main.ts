import './style.css';
import './form.css';
import { createOrderModal } from './order-form';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { createHomePageContent, createPackagePageContent, createGalleryPageContent } from './content';


const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const orderModal = createOrderModal();
  app.appendChild(orderModal.dialog);

  const menu = MenuBuilder.create({
    id: 'main-navigation',
    items: [
      { title: 'SeribuTrip', link: '#home' },
      { title: 'Paket Perjalanan', link: '#package' },
      { title: 'Gallery', link: '#gallery' },
      { title: 'FAQ', link: '#faq-section' },
    ],
  });

  const footer = ContactBuilder.create({
    id: 'contact',
    title: 'Agen Wisata SeribuTrip',
    description: 'Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.',
    items: [
      { label: 'email', data: 'halo@seributrip.id' },
      { label: 'phone', data: '+628123456789' },
      { label: 'address', data: 'Dermaga 16 Marina Ancol, Jakarta' },
    ],
  });

  const homePageContent = createHomePageContent(() => orderModal.open());

  const builder = new LandingPageBuilder({
    menu,
    pages: {
      home: homePageContent,
      package: createPackagePageContent(),
      gallery: createGalleryPageContent(),
    },
    footer
  }, {
    container: app,
    useMenu: true,
    useFooter: true,
    defaultRoute: 'home',
  });

  builder.render();
}


