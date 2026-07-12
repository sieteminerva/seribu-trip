export interface iLandingPageBuilderSource {
  menu?: HTMLElement | iBasicNode | null;
  footer?: HTMLElement | iBasicNode | null;
  pages: Record<string, iBasicNode[]>;
}

export interface iLandingPageEvents {
  beforeRender: {
    pages: iBasicNode[];
    menu: iBasicNode | null;
    footer: iBasicNode | null;
    pageMetaReport?: iPageMetaReport
  };
  onPageChanged: { route: string; activeNodes: HTMLElement[] };
  onThemeChanged: { themeId: string; shell: HTMLElement };
  onElementAdded: { element: HTMLElement; parent: HTMLElement };
  onElementRemoved: { element: HTMLElement };
  onReady: { shell: HTMLElement; components: Map<string, HTMLElement> };
  onError: { message: string; error: Error; context?: string };
}


/**
 * CONTRACT SPECIFICATION: Base Contract for all Architectural Themes.
 * Every theme MUST implement this interface to be recognized by the ThemeRenderer.
 */
export interface iThemeModule {
  readonly themeId: string;
  readonly name: string;

  /**
   * 🧙‍♂️ HOOK 1: STRUCTURAL MUTATION (Pre-Render Lifecycle)
   * Veto right to reconstruct the raw template objects BEFORE DOM synthesis.
   */
  beforePageRender?(
    pageBlocks: iBasicNode[],
    menuBlock: iBasicNode | null,
    footerBlock: iBasicNode | null,
    pageMetaReport?: iPageMetaReport
  ): {
    pages: iBasicNode[];
    menu: iBasicNode | null;
    footer: iBasicNode | null;
  };

  /**
   * ⚡ HOOK 2: BEHAVIORAL INTERACTION (Post-Render Lifecycle)
   * Triggered when the final elements tree is fully live on the DOM.
   */
  activate(shell: HTMLElement, elements: HTMLElement[]): void;

  /**
   * 🛑 HOOK 3: MEMORY CLEANUP (Unmount Lifecycle)
   * MUST be used to unbind custom event listeners to eliminate memory leaks.
   */
  deactivate?(shell: HTMLElement): void;
}


export type themeSwitcherPosition = "top-left" | "top-right" | "bottom-right" | "bottom-left";


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
export interface iCardProperty extends iDefaultProps {
  header: string;
  body: { name: string; className: string }[];
  action?: iActionProperty;
}

// Skema untuk Form Builder
export interface iFormGroupNode {
  legend?: string;
  title?: string;
  description?: string;
  className?: string;
  submitButton?: boolean;
  group: Array<iBasicInputNode | HTMLElement | string>;
}

// =========================================
// 2. INPUT & FORM
// =========================================
export type InputType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "range"
  | "date"
  | "time"
  | "datetime-local"
  | "file"
  | "color"
  | "email"
  | "password"
  | "url"
  | "tel"
  | "hidden";

export interface InputBuilderSelectorOption {
  value?: string;
  label?: string;
  icon?: string;
}

export interface InputBuilderConfigOptions {
  attributes?: Array<{ name: string; value: string }>;
  style?: string;
  field?: string;
  className?: string;
  options?: Array<string | InputBuilderSelectorOption>;
  position?: "left" | "right";
  icon?: string;
  content?: string | Record<string, unknown>;
  action?: { mode?: string } | null;
  actionMode?: string;
  wide?: number | null;
  useLabel?: boolean;
  view?: string;
  thumbnail?: boolean;
  maxUpload?: number;
  maxFileSize?: number;
  groupUnallowed?: boolean;
  createEventListener?: boolean;
  display?: "block" | "inline";
}

export interface iBasicInputNode {
  type?: InputType;
  id?: string;
  name?: string;
  title?: string;
  placeholder?: string;
  value?: string | number | boolean;
  rows?: number;
  cols?: number;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  checked?: boolean;
  range?: string;
  info?: string;
  accept?: string;
  config?: Partial<InputBuilderConfigOptions>;
  [key: string]: unknown;
}

export interface iComponentMeta {
  active: boolean;
  container: string;       // Selector CSS unik tempat dia bersarang (misal: "div#carousel-container")
  count: number;           // Jumlah komponen sejenis di halaman tersebut
  instances: any[];        // Salinan referensi payload data internalnya
}

export interface iPageMetaReport {
  isArray: boolean;
  totalSections: number;
  hasComponent: {
    [K in keyof iBuilderRegistry]?: iComponentMeta;
  };
  // Tambahan info taktis: Daftar seluruh ID seksi dan label nama seksi untuk timeline
  timelinePaths: Array<{ id: string; name: string; type: string }>;
}

// ==========================================
// 2. KONTRAK REGISTRY UTAMA (Single Source of Truth)
// ==========================================
export interface iBuilderRegistry {
  carousel: iBuilderContent[];
  accordion: iHeaderProperty[];
  "pricing-card": iCardProperty[];
  masonry: iBuilderContent[];
  section: iBuilderContent[];
  form: Array<iBasicInputNode | iFormGroupNode | HTMLElement | string>;
  menu: iBasicNode,
  footer: iBasicNode
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
  // 💡 INTERNAL SYSTEM TRACKING: Metadata penanda form admin dashboard Anda
  _field?: string;

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
