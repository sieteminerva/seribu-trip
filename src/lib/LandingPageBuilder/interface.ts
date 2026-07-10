export interface iLandingPageBuilderSource {
  menu?: HTMLElement | null;
  footer?: HTMLElement | null;
  pages: Record<string, iBasicNode[]>;
}

interface iDefaultProps {
  id?: string;
  className?: string;
  tagName?: string;
}
// ==========================================
// 1. INDIVIDUAL ATOM PROPERTIES & DESIGN TOKENS
// ==========================================
export interface iHeaderProperty extends iDefaultProps {
  title?: string;
  eyebrow?: string;
  description?: string;
}

export interface iActionProperty extends iDefaultProps {
  label?: string;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent) => void;
}

// Data Item khusus untuk builder bertipe 'section', 'carousel', 'masonry'
export interface iBuilderContent extends iDefaultProps {
  title?: string;
  description?: string;
  image?: string;
  actions?: iActionProperty[];
  category?: string;
}

// Data Item khusus untuk builder bertipe 'pricing-table'
export interface iTableProperty extends iDefaultProps {
  header: string;
  body: { name: string; className: string }[];
  action?: iActionProperty;
}

// ==========================================
// 2. KONTRAK REGISTRY UTAMA (Single Source of Truth)
// ==========================================
export interface iBuilderRegistry {
  carousel: iBuilderContent[];
  accordion: iHeaderProperty[];
  "pricing-table": iTableProperty[];
  masonry: iBuilderContent[];
  section: iBuilderContent[];
  // Untuk komponen baru nanti, cukup daftarkan jenis array atomnya di sini:
  // stats: iStatsProperty[];
}

// Function signature constraint for allowed builders
export type ComponentBuilderFn<Args = any> = (content: Args) => HTMLElement | null;

// Registry map type contract tracking all active builder functions
export type BuilderFunctionsMap = {
  [K in keyof iBuilderRegistry]: ComponentBuilderFn<iBuilderRegistry[K]>;
};

// ==========================================
// 3. BASE STRUCTURAL HOOKS INTERFACE
// ==========================================
export interface iNodeLifecycleHooks {
  onCreated?: (element: HTMLElement) => void;
  onDestroy?: (element: HTMLElement) => void;
}

// ==========================================
// 4. ADVANCED MODE PATTERNS (String Selectors)
// ==========================================
export type DefaultSelectors = 'grid' | 'row' | 'column' | string;
export type ValidLayoutKey<S extends string> = S | `${S}${string}`;

// Rantai Rekursif Advanced Mode untuk Elemen HTML Standar
export interface iAdvancedStandardNode<S extends string = DefaultSelectors> extends iNodeLifecycleHooks {
  builder?: never;
  attrs?: Record<string, string>;
  content?: string | HTMLElement | iNodeContent<S> | iNodeContent<S>[];
  [childKey: string]: any;
}

// Rantai Rekursif Advanced Mode untuk Builder Komponen Kompleks (Mendukung Penyatuan Content)
export type iAdvancedBuilderNode<S extends string = DefaultSelectors> = {
  [K in keyof iBuilderRegistry]: iNodeLifecycleHooks & {
    builder: K;
    content: iBuilderRegistry[K]; // Mengunci content secara otomatis menjadi array item dari registry komponen tersebut!
    attrs?: Record<string, string>;
    [childKey: string]: iNodeContent<S> | any;
  }
}[keyof iBuilderRegistry];

// Kombinasi Utama untuk Item Node di Advanced Mode
export type iLayoutItemNode<S extends string = DefaultSelectors> =
  | iAdvancedStandardNode<S>
  | iAdvancedBuilderNode<S>;

export type iDOMStructure<S extends string = DefaultSelectors> = {
  [K in ValidLayoutKey<S>]?: iLayoutItemNode<S> | any;
};

export type iNodeContent<S extends string = DefaultSelectors> = iDOMStructure<S>;


// ==========================================
// 5. BASIC MODE PATTERNS (JSON Style / Ramah Pemula)
// ==========================================

// Rantai Rekursif Basic Mode untuk Elemen HTML Standar + Custom Attributes Support
export interface iBasicStandardNode extends iNodeLifecycleHooks {
  tagName?: string;
  id?: string;
  className?: string;
  builder?: never;
  isRoot?: boolean;
  content?: string | HTMLElement | iBasicNode | iBasicNode[] | iActionProperty;
  [customHtmlAttr: string]: any;
}

// Rantai Rekursif Basic Mode untuk Builder Komponen Kompleks (Mendukung Penyatuan Content)
export type iBasicBuilderNode = {
  [K in keyof iBuilderRegistry]: iNodeLifecycleHooks & {
    tagName?: string;
    id?: string;
    className?: string;
    builder: K;
    isRoot?: boolean;
    content: iBuilderRegistry[K]; // Mengunci content secara otomatis menjadi array item dari registry komponen tersebut!
    [customHtmlAttr: string]: any;
  }
}[keyof iBuilderRegistry];

export type iBasicNode = iBasicStandardNode | iBasicBuilderNode;
