export interface iLandingPageBuilderConfig {
  container: HTMLElement | string;
  theme?: 'light' | 'dark' | string;
  allowCustomClasses?: boolean;
  onSectionRendered?: (sectionId: string, element: HTMLElement) => void;
}

export interface iSectionHeader {
  title?: string;
  eyebrow?: string;
  description?: string;
  className?: string; // For alignment or header styling overrides
}

export interface iSectionBlock {
  name: string;
  id?: string;
  className?: string;
  isSection?: boolean; // Optional flag to indicate if this node is a section block
  tagName?: string; // Optional override for the HTML tag used for the section
  header?: iSectionHeader; // Optional section header structural definition
  content: string | HTMLElement | iSectionContent;
}

export interface iGroupNode {
  name: string;
  id?: string;
  className?: string;
  isSection?: boolean; // Optional flag to indicate if this node is a section block
  tagName?: string; // Optional override for the HTML tag used for the section
  header?: iSectionHeader; // A group can also have a single overarching header!
  group: iLandingPageNode[];
}

export type iLandingPageNode = iSectionBlock | iGroupNode;

/* Module interfaces */
export interface iSectionContent {
  id?: string;
  className?: string;
  items: iSectionProperty[];
}

export interface iMenuContent {
  id?: string;
  className?: string;
  items: { title: string; link: string; }[];
}

export interface iHeroContent {
  image?: string;
  title?: string;
  actions?: iActionProperty[]
}

export interface iStatsContent {
  id?: string;
  className?: string;
  items: { title?: string; description?: string; }[];
}


export interface iAccordionContent {
  id?: string;
  name?: string;
  className?: string;
  image?: string;
  title?: string;
  items: { eyebrow?: string; title?: string; description?: string; }[];
}

export interface iContactContent {
  id?: string;
  className?: string;
  title: string;
  description: string;
  items: Record<string, string | iActionProperty[]>[]
}

export type iActionProperty = { label?: string; href?: string; id?: string; className?: string; type?: string };
export type iSectionProperty = { title?: string; description?: string; image?: string; actions?: iActionProperty[] }