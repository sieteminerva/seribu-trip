import './style.css';
import './form.css';
import { createOrderModal } from './order-form';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { createHomePageContent, createPackagePageContent } from './content';

document.addEventListener("DOMContentLoaded", (event) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app) {
    const orderModal = createOrderModal();
    app.appendChild(orderModal.dialog);

    const menu = MenuBuilder.create({
      id: 'main-navigation',
      items: [
        { title: 'SeribuTrip', link: '#home' },
        { title: 'Paket Perjalanan', link: '#package' },
        { title: 'FAQ', link: '#faq-section' },
      ],
    });

    const footer = ContactBuilder.create({
      id: 'contact',
      title: 'Agen Wisata SeribuTrip',
      description: 'Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.',
      items: [
        { label: 'email', data: 'halo@pulauseributrip.id' },
        { label: 'phone', data: '+628123456789' },
        { label: 'address', data: 'Dermaga 16 Marina Ancol, Jakarta' },
      ],
    });

    const homePageContent = createHomePageContent(() => orderModal.open());

    const builder = new LandingPageBuilder({
      menu,
      footer,
      pages: {
        home: homePageContent,
        package: createPackagePageContent(),
      },
    }, {
      container: app,
      useMenu: true,
      useFooter: true,
      defaultRoute: 'home',
    });

    builder.render();
  }

});
