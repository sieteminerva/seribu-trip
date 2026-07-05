import './style.css';
import './form.css';
import { createOrderModal } from './order-form';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { HomePageContent, PackagePageContent } from './content';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const menu = MenuBuilder.create({
    id: 'main-navigation',
    items: [
      { title: 'SeribuTrip', link: '/' },
      { title: 'Paket Perjalanan', id: 'open-package' },
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

  const builder = new LandingPageBuilder(HomePageContent, {
    container: app,
    useMenu: true,
    useFooter: true,
    menu,
    footer,
  });

  builder.render();

  const orderModal = createOrderModal();
  app.appendChild(orderModal.dialog);

  const launchers = [
    app.querySelector<HTMLButtonElement>('#open-order-modal'),
    app.querySelector<HTMLButtonElement>('#open-order-modal-cta'),
  ];

  launchers.forEach((launcher) => {
    if (launcher) {
      launcher.addEventListener('click', () => orderModal.open());
    }
  });

  const packageLauncher = app.querySelector<HTMLElement>('#open-package');
  packageLauncher?.addEventListener('click', (event) => {
    event.preventDefault();
    builder.switchPage(PackagePageContent);
  });
}
