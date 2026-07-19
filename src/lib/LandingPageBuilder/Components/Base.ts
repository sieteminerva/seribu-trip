import type { iBasicNode, iBuilderConfig, iBuilderRegistry } from "../interface";
import { TemplateRegistry, type TemplateHandler } from "../Modules/TemplateRegistry";

/**
 * Abstract Core Base Class representing the definitive declarative rendering engine blueprint.
 * Orchestrates a unidirectional 5-Phase lifecycle execution stream to parse configurations,
 * traverse hierarchical tree registries, mutate content templates, and emit runtime state safely.
 * 
 * @template TType - A strict string literal union constraining the allowed sub-element tokens for the child component.
 * 
 * @author YMGH
 * @version 1.0.0
 */
export abstract class Builder<TType extends string = string> {

  /**
   * The distinct, unique registry identifier allocated to the specific component subclass.
   */
  abstract readonly builderId: keyof iBuilderRegistry;

  /**
   * The human-readable name string designated to characterize the component wrapper class.
   */
  abstract readonly name: string;

  /**
   * The file path pointer target referencing the isolated CSS stylesheet asset assigned to this module.
   */
  abstract readonly stylesheet: string;

  /**
   * The frozen state configuration container holding consolidated options, emitters, and structural selectors.
   */
  public config!: Required<iBuilderConfig<TType>>;

  /**
   * Internal reference holder pointing directly to the raw, unmutated data node extracted from the spreadsheet database.
   */
  protected abstract rawDataNode: any;

  /**
   * Highly optimized, flyweight memory-cached function binding acting as the default fallback layout renderer.
   */
  protected abstract readonly defaultTemplate: TemplateHandler<TType>;


  /**
   * Consolidates default specifications with third-party configurations into a unified data structure,
   * performing an accurate deep-merge execution specifically isolated for selector dictionaries and HTML attributes.
   * 
   * @param defaultOptions - The structural default parameters including core properties and blueprint selectors.
   * @param userConfig - Incoming contextual overrides sent dynamically by themes or framework controllers.
   * @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
   * @template C - Menangkap tipe Interface Config anak secara penuh (e.g. iMenuConfig)
   * @protected
   */
  protected resolveConfig<C extends iBuilderConfig<TType>>(
    defaultOptions: Required<C> | any,
    userConfig: Partial<C> = {}
  ): Required<C> {
    // Step 1: Initialize the local layout registry by cloning the component's default structural selector nodes.
    const mergedSelectors = { ...(defaultOptions.selectors || {}) } as Record<string, any>;

    // Step 2: Validate the existence of third-party selectors overrides hantaran userConfig layers.
    if (userConfig.selectors) {
      // Step 3: Traverse the override dictionary entries linearly to assimilate the specialized structural tokens.
      Object.entries(userConfig.selectors).forEach(([key, selectorValue]) => {
        if (selectorValue && typeof selectorValue === "object") {
          mergedSelectors[key] = {
            ...(mergedSelectors[key] || {}),
            ...selectorValue,
            // Step 5: Secure the critical HTML custom attributes dictionary block to guarantee zero property evaporation.
            attrs: {
              ...((mergedSelectors[key] || {}).attrs || {}),
              ...((selectorValue as any).attrs || {})
            }
          };
        }
      });
    }
    // Step 6: Package the consolidated state metadata container, ensuring selectors are strictly typed and sealed.
    return {
      ...defaultOptions,
      ...userConfig,
      selectors: mergedSelectors
    } as Required<C>;
  }


  /**
   * The public sovereign compiler gateway orchestrating the complete DOM node creation lifecycle stream.
   * Processes input data through a rigid 5-Phase pipeline, returning a live, fully-hydrated HTMLElement.
   * 
   * @param content - The raw payload structural object delivered by the central sheet transformer.
   * @param config - Given builder config.
   * @returns A fully materialized, state-bound graphical DOM tree container element.
   * 
   * @public
   */
  public create(content: iBasicNode, config?: Partial<iBuilderConfig<TType>>): HTMLElement {
    this.config = this.resolveConfig(this.config, config);

    const rootSelectorKey = `@${String(this.builderId)}`;

    // Step 1: Execute defensive short-circuit check. If payload is corrupted, instantly emit a blank fallback shell.
    if (!content || typeof content !== "object") {
      return document.createElement(this.config.selectors[rootSelectorKey as TType]?.tagName || "div");
    }
    // Step 2: Lock the immutable raw input pointer reference inside the instance memory tracking field.
    this.rawDataNode = content;

    // Step 3: Trigger PHASE 1 - Manufacture the raw, flat dictionary of detached, pristine HTMLElements.
    const renderedNodes = this.renderElements();

    // Step 4: Trigger PHASE 2 - Parse the token strings and reconstruct the nested genealogical DOM parent-child tree.
    this.attachHierarchy(renderedNodes);

    // Step 5: Trigger PHASE 3 - Feed structural layout payloads into the cascading template interpolation factory.
    this.hydrate(renderedNodes, content);

    // Step 6: Secure a strong direct reference pointer indicating the sovereign root container element.
    const rootElement = renderedNodes.get(rootSelectorKey) as HTMLElement;

    // Step 7: Trigger PHASE 4 - Dispatch structural genesis reports universally through the pipeline emitter.
    this.emitElements(renderedNodes);

    // Step 8: Trigger PHASE 5 - Bind persistent runtime browser interactive listeners exclusively to the root node.
    this.initialize(rootElement);

    // Step 9: Return the fully compiled, optimized, and ready-to-paint master interface node.
    return rootElement;
  }

  /**
   * PHASE 1: Scans the active selector registry to map out and spawn detached HTML elements.
   * Purges boilerplate manipulation by cleanly stamping basic IDs, classes, and generic properties in memory.
   * 
   * @returns A mapped tracking dictionary pairing registry keys to their pristine element references.
   * @protected
   */
  protected renderElements(): Map<string, HTMLElement> {
    const renderedNodes = new Map<string, HTMLElement>();

    Object.entries(this.config.selectors).forEach(([key, selector]: [string, any]) => {
      // Step 1: Tokenize the key signature using the signifier symbol '>' to scan ancestral lineage.
      const pathParts = key.split(">");
      if (pathParts.length > 1) {
        // Step 2: Extract the direct immediate parent key token dynamically (e.g., "@menu>navigations").
        const parentKey = pathParts.slice(0, -1).join(">");
        const parentSelector = this.config.selectors[parentKey as TType];

        // Step 3: Intercept dynamic templates. If the parent carries the 'isArray' flag, skip instant allocation 
        // because its multi-instance clones must be generated on-demand inside Phase 3 based on live sheet rows.
        if (parentSelector && parentSelector.isArray) return;
      }

      // Step 4: Instantly evoke the browser native factory to forge the specified element tagName shell.
      const el = document.createElement(selector.tagName || "div");

      // Step 5: Linearly stamp surface declarative properties like IDs, classNames, and innerHTML templates.
      if (selector.id) el.id = selector.id;
      if (selector.className) el.className = selector.className;
      if (selector.innerHTML) el.innerHTML = selector.innerHTML;

      // Step 6: Traverse custom attribute objects to punch specialized modifiers directly into the native element core.
      if (selector.attrs) {
        Object.entries(selector.attrs).forEach(([aKey, aValue]) => el.setAttribute(aKey, String(aValue)));
      }

      // Step 7: Push the fully prepared element reference pointer securely into the local cache compilation map.
      renderedNodes.set(key, el);
    });

    return renderedNodes;
  }

  /**
   * PHASE 2: Processes path keys using a recursive string-split traversal method.
   * Dynamically constructs the spatial DOM tree architecture without using any hardcoded references.
   * 
   * @param renderedNodes - The live collection map holding all prepared, detached HTML elements.
   * @protected
   */
  protected attachHierarchy(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      // Step 1: Deconstruct the selector string key path to inspect its depth structural levels.
      const pathParts = key.split(">");

      // Step 2: Filter out root nodes. If depth length is greater than 1, a true parent-child matrix exists.
      if (pathParts.length > 1) {
        // Step 3: Compute the parent key identity string by cutting off the outermost trailing child node edge.
        const parentKey = pathParts.slice(0, -1).join(">");

        // Step 4: Fetch the parent HTMLElement pointer reference directly from the active cache compilation map.
        const parentElement = renderedNodes.get(parentKey);

        // Step 5: Evoke appendChild on the parent node, seamlessly dropping the child element into its proper DOM coordinates.
        parentElement?.appendChild(el);
      }
    });
  }


  /**
   * PHASE 3: Maps clean sheet data slices into the corresponding compiled node pipelines.
   * Invokes the Cascading Cascade Resolver to allow external themes or plugins to override layouts.
   * 
   * @param renderedNodes - The fully assembled structural DOM tree elements map.
   * @param content - The raw dataset package hantaran sheets controller.
   * @protected
   */
  protected hydrate(renderedNodes: Map<string, HTMLElement>, content: any): void {
    // Step 1: Delegate raw sheet data parsing to the child implementation hook to harvest uniform data sections.
    const payloadMap = this.resolvePayload(content);

    // Step 2: Grab the real-time active theme data context string straight from the browser document root dataset.
    const activeLiveThemeId = this.config.themeId
      || document.documentElement.dataset.theme?.replace(/^theme-/, "")
      || document.body.dataset.theme?.replace(/^theme-/, "")
      || "default";

    // Step 3: Traverse the assembly element nodes sequentially to activate custom content injections.
    renderedNodes.forEach((el, key) => {
      const selector = this.config.selectors[key as TType];
      const payloadData = payloadMap[key];

      // Step 4: Intercept Multi-Instance structural arrays flagged by the 'isArray' behavior directive token.
      if (selector && (selector as any).isArray) {
        const childTemplateKey = `${key}>item`;
        const itemTemplateSelector = this.config.selectors[childTemplateKey as TType];
        const dataItemsArray = Array.isArray(payloadData) ? payloadData : [];

        // Step 5: Flood the array container node by iterating over the rows list dynamically.
        dataItemsArray.forEach((itemData) => {
          // Step 6: Clone a new clean structural sub-child capsule template element in memory.
          const childEl = document.createElement(itemTemplateSelector.tagName || "div");
          if (itemTemplateSelector.className) childEl.className = itemTemplateSelector.className;
          if (itemTemplateSelector.attrs) {
            Object.entries(itemTemplateSelector.attrs).forEach(([k, v]) => childEl.setAttribute(k, String(v)));
          }

          // Step 7: Query the TemplateRegistry Cascade Resolver for dynamic skin adjustments (Themes / Plugins).
          const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, childTemplateKey, this.defaultTemplate);

          // Step 8: Fire the matched handler to paint internal custom properties onto the repeated child node capsule.
          activeHandler(childTemplateKey, childEl, itemData, itemTemplateSelector);

          // Step 9: Thread the newly hydrated sub-child element directly into the active multi-instance container parent.
          el.appendChild(childEl);
        });
      }
      // Step 10: Process Standard Singleton Elements
      else {
        // Step 11: Call Cascade Resolver to query: "Is there a cyberpunk override handler for this selector key?"
        const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, key, this.defaultTemplate);

        // Step 12: Direct data injection flow seamlessly into the target element structure.
        activeHandler(key, el, payloadData, selector);
      }
    });
  }


  /**
   * PHASE 4: Dispatches precise structural genesis notifications to the central messaging pipeline.
   * Allows independent ecosystem systems to observe or monitor element assembly.
   * @param renderedNodes - The finalized, fully hydrated dictionary of living DOM elements.
   * @protected
   */
  protected emitElements(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      // Step 1: Evaluate if a global event emitter callback hook has been supplied.
      // Step 2: Stream out the element birth notification payload to notify parent layout
      this.config.emit?.("elementAdded", {
        builder: this.builderId,
        type: key as TType,
        element: el,
        data: this.rawDataNode
      });
    });
  }


  // ====================================================
  // 🔮 3. ABSTRACT HOOKS (COMPULSORY SUBCLASS OVERRIDES)
  // Dedicated functional compartments where concrete 
  // builders inject distinct business rules.
  // ====================================================

  /**
   * Isolated data-splitting hook. Must clean and segment raw linear sheet inputsinto an organized map of specific data shapes dedicated per registry key.
   */
  protected abstract resolvePayload(content: any): Record<string, any>;

  /**
   * The localized internal layout factory. 
   * Contains hardcoded default structuralblueprints to populate HTML content elements if no external override handler is resolved.
   */
  protected abstract template(typeKey: string, el: HTMLElement, payload: any, selector: any): void;

  /**
   * Runtime event-binding hook. 
   * Triggered at the very end of the creation lifecycleto lock persistent browser click/drag/swipe 
   * interactive listeners onto the completed DOM structure.
   */
  public abstract initialize(root: HTMLElement): void;
}
