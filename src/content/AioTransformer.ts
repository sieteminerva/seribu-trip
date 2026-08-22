/**
 * @typedef AioTransformType
 * @summary Defines the transform method selected by `meta.type[property]`.
 *
 * Purpose: keeps transformer dispatch controlled by input metadata.
 * Parameters: none.
 * Return type: supported transform method names.
 * @throws Does not throw.
 *
 * @example
 * const type: AioTransformType = 'SELECTOR_TO_ELEMENT';
 */
export type AioTransformType =
  | 'SELECTOR_TO_ELEMENT'
  | 'ARRAY_CHILD_KEY'
  | 'ARRAY_TO_STRING'
  | 'NESTED_OBJECT';

/**
 * @typedef AioRecord
 * @summary Represents a dynamic row or node object.
 *
 * Purpose: supports sample data whose fields vary per use case.
 * Parameters: none.
 * Return type: record with string keys.
 * @throws Does not throw.
 *
 * @example
 * const row: AioRecord = { uid: 'a', node: '.card>h2.title' };
 */
export type AioRecord = Record<string, unknown>;

/**
 * @typedef AioPayload
 * @summary Represents an API input file with `meta.type` and `data`.
 *
 * Purpose: lets `fromObject` read transform instructions and flat rows from one object.
 * @param {object} [meta] Payload metadata.
 * @param {Record<string, AioTransformType>} [meta.type] Property-to-method map.
 * @param {AioRecord[]} [data] Flat input rows.
 * Return type: input payload.
 * @throws Does not throw.
 *
 * @example
 * const payload: AioPayload = { meta: { type: { node: 'SELECTOR_TO_ELEMENT' } }, data: [] };
 */
export interface AioPayload {
  meta?: {
    type?: Record<string, AioTransformType>;
    [key: string]: unknown;
  };
  data?: AioRecord[];
  [key: string]: unknown;
}

/**
 * @typedef TableNode
 * @summary Represents table output with headers and string rows.
 *
 * Purpose: provides a final tabular projection from flat or model data.
 * @param {string[]} header Column names.
 * @param {string[][]} body Row values.
 * Return type: table node.
 * @throws Does not throw.
 *
 * @example
 * const table: TableNode = { header: ['uid'], body: [['a']] };
 */
export interface TableNode {
  header: string[];
  body: string[][];
}

/**
 * @typedef AioTransformerConfig
 * @summary Configures selector syntax and generic field names used by the transformer.
 *
 * Purpose: removes hardcoded selector markers while keeping `meta.type[property]` as the transform map.
 * @param {string} childDelimiter Selector parent-child delimiter.
 * @param {string} classPrefix Selector class prefix.
 * @param {string} idPrefix Selector id prefix.
 * @param {string} builderDelimiter Selector builder delimiter.
 * @param {string} listDelimiter Input list delimiter.
 * @param {string} outputListDelimiter Output list delimiter.
 * @param {string} nestedDelimiter Nested pointer delimiter.
 * @param {string} pathDelimiter Nested path delimiter.
 * @param {RegExp} indexPattern Pattern removed from selectors.
 * @param {string} uidField Row id field.
 * @param {string} contentField Child/content field.
 * @param {string} titleField Title field.
 * @param {string} sectionField Section field.
 * Return type: transformer config.
 * @throws Does not throw.
 *
 * @example
 * const transformer = new AioTransformer({ classPrefix: '~' });
 */
export interface AioTransformerConfig {
  childDelimiter: string;
  classPrefix: string;
  idPrefix: string;
  builderDelimiter: string;
  listDelimiter: string;
  outputListDelimiter: string;
  nestedDelimiter: string;
  pathDelimiter: string;
  indexPattern: RegExp;
  uidField: string;
  contentField: string;
  titleField: string;
  sectionField: string;
}



/**
 * @constant DEFAULT_AIO_TRANSFORMER_CONFIG
 * @summary Default config for selector syntax and common row keys.
 *
 * Purpose: keeps configurable syntax in one place.
 * Parameters: none.
 * Return type: `AioTransformerConfig`.
 * @throws Does not throw.
 *
 * @example
 * const config = DEFAULT_AIO_TRANSFORMER_CONFIG;
 */
export const DEFAULT_AIO_TRANSFORMER_CONFIG: AioTransformerConfig = {
  childDelimiter: '>',
  classPrefix: '.',
  idPrefix: '#',
  builderDelimiter: '@',
  listDelimiter: ',',
  outputListDelimiter: ', ',
  nestedDelimiter: '#',
  pathDelimiter: '.',
  indexPattern: /\$\d+/g,
  uidField: 'uid',
  contentField: 'content',
  titleField: 'title',
  sectionField: 'section',
};

export interface AioTransformerConfig2 {
  symbols: {
    hierarchy: string;
    class: string;
    id: string;
    list: string;
    sibling: string;
    index: string;
    namespace: string;
    child: string;
  };
  pointers: {
    client: string;
    server: string;
    content: string;
    section: string;
  }
}

/**
 * @class AioTransformer
 * @summary Converts flat `input.json` payloads into model arrays like `output.json`, and flattens model
 * arrays back into input-style `data[]`.
 *
 * Purpose: provides a metadata-driven transformer for all sample folders.
 * @param {Partial<AioTransformerConfig>} [config] Optional syntax/field override.
 * Return type: transformer instance.
 * @throws Does not throw.
 *
 * @example
 * const transformer = new AioTransformer();
 * const model = transformer.fromObject(inputJson);
 * const rows = transformer.toObject(model);
 */
export class AioTransformer {
  /**
   * @variable config
   * @summary Runtime config merged from defaults and constructor overrides.
   *
   * Purpose: stores syntax and field names used by every helper.
   * Parameters: none.
   * Return type: `AioTransformerConfig`.
   * @throws Does not throw.
   *
   * @example
   * transformer.config.childDelimiter;
   */
  public readonly config: AioTransformerConfig;

  /**
   * @variable types
   * @summary Last `meta.type` map read by `fromObject`.
   *
   * Purpose: lets `toObject(model)` reverse using the previous metadata when the caller passes only an array.
   * Parameters: none.
   * Return type: property-to-transform map.
   * @throws Does not throw.
   *
   * @example
   * transformer.fromObject(inputJson);
   * transformer.toObject(model);
   */
  private types: Record<string, AioTransformType> = {};

  /**
   * @constructor
   * @summary Creates a transformer with configurable syntax.
   *
   * Purpose: initializes reusable transformer state.
   * @param {Partial<AioTransformerConfig>} [config] Optional override config.
   * @returns {AioTransformer} Configured instance.
   * @throws Does not throw.
   *
   * @example
   * const transformer = new AioTransformer({ listDelimiter: '|' });
   */
  public constructor(config: Partial<AioTransformerConfig> = {}) {
    // Step 1: Merge caller config with defaults.
    this.config = { ...DEFAULT_AIO_TRANSFORMER_CONFIG, ...config };
  }

  /**
   * @method fromObject
   * @summary Converts flat API input into output model structure. It applies list and nested transforms, then
   * builds component/content trees from selector rows when `SELECTOR_TO_ELEMENT` exists.
   *
   * Purpose: transforms any `input.json` sample toward its ` output.json` model shape.
   * @param { AioPayload } payload Input payload containing `meta.type` and`data`.
   * @returns { AioRecord[] } Model array.
   * @throws Does not throw.
   *
   * @example
   * const outputModel = transformer.fromObject(inputJson);
   */
  public fromObject(payload: AioPayload): AioRecord[] {
    // Step 1: Read metadata and clone input rows.
    this.types = payload.meta?.type ?? {};
    let rows = this.cloneRows(payload.data ?? []);

    // Step 2: Fold nested pointer rows when requested.
    rows = this.applyNestedFromRows(rows);

    // Step 3: Apply simple property transforms driven by `meta.type[property]`.
    rows = rows.map((row) => this.transformFlatRow(row));

    // Step 4: Build DOM/model output when selector rows are present.
    if (this.hasType('SELECTOR_TO_ELEMENT')) {
      return this.rowsToModel(rows, payload);
    }

    // Step 5: Return transformed rows for non-selector data.
    return rows;
  }

  /**
   * @method toObject
   * @summary Flattens an output model array back into input-style `data[]`. The result contains generated
   * `uid`, `section`, selector `node`, and content/data properties recovered from the model.
   *
   * Purpose: transforms any `output.json` sample back toward `input.json.data`.
   * @param {AioRecord[]} model Output model array.
   * @param {Record<string, AioTransformType>} [types] Optional transform type map.
   * @returns {AioRecord[]} Flat input-style rows.
   * @throws Does not throw.
   *
   * @example
   * const rows = transformer.toObject(outputJson);
   */
  public toObject(model: AioRecord[], types: Record<string, AioTransformType> = this.types): AioRecord[] {
    // Step 1: Store provided types for future calls.
    this.types = types;

    // Step 2: Flatten every top-level model node.
    const rows = model.flatMap((node, index) => this.flattenModelNode(node, this.slug(String(node.name ?? `section - ${index + 1} `))));

    // Step 3: Reverse simple typed properties.
    return rows.map((row) => this.reverseFlatRow(row));
  }

  /**
   * @method toTableNode
   * @summary Converts rows or model data into `{ header, body } `.
   *
   * Purpose: provides a final table representation from transformer input or output.
   * @param {AioPayload | AioRecord[]} input Payload or row/model array.
   * @returns {TableNode} Header/body table.
   * @throws {TypeError} Throws when `JSON.stringify` receives circular values.
   *
   * @example
   * const table = transformer.toTableNode(inputJson);
   */
  public toTableNode(input: AioPayload | AioRecord[]): TableNode {
    // Step 1: Resolve data from payload or array.
    const data = Array.isArray(input) ? input : input.data ?? [];

    // Step 2: Collect all unique headers.
    const header = Array.from(data.reduce<Set<string>>((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()));

    // Step 3: Build body cells using header order.
    const body = data.map((row) => header.map((key) => this.stringifyCell(row[key])));

    // Step 4: Return table node.
    return { header, body };
  }

  /**
   * @method transformFlatRow
   * @summary Applies non-structural transforms to one flat row.
   *
   * Purpose: lets `meta.type[property]` decide how each row property is converted.
   * @param {AioRecord} row Row to transform.
   * @returns {AioRecord} Transformed row.
   * @throws Does not throw.
   *
   * @example
   * transformer['transformFlatRow']({ colors: 'a, b' });
   */
  private transformFlatRow(row: AioRecord): AioRecord {
    // Step 1: Clone row before modification.
    const next = { ...row };

    // Step 2: Apply simple transforms per metadata property.
    for (const [property, type] of Object.entries(this.types)) {
      if (!(property in next)) continue;
      if (type === 'ARRAY_TO_STRING' || type === 'ARRAY_CHILD_KEY') next[property] = this.splitList(next[property]);
    }

    // Step 3: Return transformed row.
    return next;
  }

  /**
   * @method reverseFlatRow
   * @summary Reverses non-structural transforms on one flat row.
   *
   * Purpose: converts arrays and nested pointer objects back into input-style strings.
   * @param {AioRecord} row Row to reverse.
   * @returns {AioRecord} Reversed row.
   * @throws Does not throw.
   *
   * @example
   * transformer['reverseFlatRow']({ colors: ['a', 'b'] });
   */
  private reverseFlatRow(row: AioRecord): AioRecord {
    // Step 1: Clone row before modification.
    const next = { ...row };

    // Step 2: Reverse transform properties from metadata.
    for (const [property, type] of Object.entries(this.types)) {
      if (!(property in next)) continue;
      if (type === 'ARRAY_TO_STRING' || type === 'ARRAY_CHILD_KEY') next[property] = this.joinList(next[property]);
    }

    // Step 3: Return reversed row.
    return next;
  }

  /**
   * @method applyNestedFromRows
   * @summary Folds rows whose typed property contains `parent#path` into the parent row.
   *
   * Purpose: supports `NESTED_OBJECT` samples without hardcoded nested schema mapping.
   * @param {AioRecord[]} rows Flat rows.
   * @returns {AioRecord[]} Rows with nested child rows removed.
   * @throws Does not throw.
   *
   * @example
   * transformer['applyNestedFromRows'](rows);
   */
  private applyNestedFromRows(rows: AioRecord[]): AioRecord[] {
    // Step 1: Find the property marked as NESTED_OBJECT.
    const nestedProperty = Object.entries(this.types).find(([, type]) => type === 'NESTED_OBJECT')?.[0];
    if (!nestedProperty) return rows;

    // Step 2: Index rows by uid.
    const byUid = new Map(rows.map((row) => [String(row[this.config.uidField]), row]));
    const childRows = new Set<AioRecord>();

    // Step 3: Move child values into parent nested paths.
    for (const row of rows) {
      const pointer = row[nestedProperty];
      if (typeof pointer !== 'string' || !pointer.includes(this.config.nestedDelimiter)) continue;
      const [parentUid, path] = pointer.split(this.config.nestedDelimiter);
      const parent = byUid.get(parentUid);
      if (!parent || !path) continue;
      this.setPath(parent, path, this.pickRowValue(row, [nestedProperty]));
      childRows.add(row);
    }

    // Step 4: Remove folded child rows.
    return rows.filter((row) => !childRows.has(row));
  }

  /**
   * @method rowsToModel
   * @summary Builds top-level output model nodes from flat rows.
   *
   * Purpose: converts selector rows and table-like rows into model structures similar to sample outputs.
   * @param {AioRecord[]} rows Transformed flat rows.
   * @param {AioPayload} payload Original payload for rendering/options metadata.
   * @returns {AioRecord[]} Output model nodes.
   * @throws Does not throw.
   *
   * @example
   * transformer['rowsToModel'](rows, payload);
   */
  private rowsToModel(rows: AioRecord[], payload: AioPayload): AioRecord[] {
    // Step 1: Group rows by section.
    const sections = new Map<string, AioRecord[]>();
    for (const row of rows) {
      const section = String(row[this.config.sectionField] ?? 'default');
      sections.set(section, [...sections.get(section) ?? [], row]);
    }

    // Step 2: Build one component per section.
    return Array.from(sections.entries()).map(([section, sectionRows]) => {
      const container = sectionRows.find((row) => row.category === 'container');
      const component = container && typeof container.node === 'string'
        ? this.selectorSegmentToElement(container.node)
        : {};

      // Step 3: Add component metadata.
      component.name = this.toTitleCase(String(container?.title ?? section));
      if (payload.meta?.rendering) component.options = { ...(this.isRecord(payload.meta.rendering) ? payload.meta.rendering : {}) };

      // Step 4: Add section content.
      component.content = this.sectionRowsToContent(sectionRows.filter((row) => row !== container));
      return component;
    });
  }

  /**
   * @method sectionRowsToContent
   * @summary Converts rows in one section into model content nodes.
   *
   * Purpose: groups selector rows by parent selector and places non-selector rows in table-like arrays.
   * @param {AioRecord[]} rows Section rows.
   * @returns {unknown[]} Model content items.
   * @throws Does not throw.
   *
   * @example
   * transformer['sectionRowsToContent'](rows);
   */
  private sectionRowsToContent(rows: AioRecord[]): unknown[] {
    // Step 1: Split selector rows and plain rows.
    const selectorRows = rows.filter((row) => typeof row.node === 'string');
    const plainRows = rows.filter((row) => typeof row.node !== 'string');
    const content: unknown[] = [];

    // Step 2: Group selector rows by first selector segment.
    const groups = new Map<string, AioRecord[]>();
    for (const row of selectorRows) {
      const selector = String(row.node);
      const parent = selector.includes(this.config.childDelimiter)
        ? selector.split(this.config.childDelimiter)[0]
        : '';
      groups.set(parent, [...groups.get(parent) ?? [], row]);
    }

    // Step 3: Convert each selector group into an element node.
    for (const [parent, groupRows] of groups) {
      const children = groupRows.map((row) => this.rowToElement(row));
      if (!parent) content.push(...children);
      else content.push({ ...this.selectorSegmentToElement(parent), content: children });
    }

    // Step 4: Append plain rows as table content.
    if (plainRows.length > 0) content.push({ options: { mode: 'table' }, content: plainRows.map((row) => this.stripInternalRowFields(row)) });

    // Step 5: Return content items.
    return content;
  }

  /**
   * @method rowToElement
   * @summary Converts one flat selector row into one leaf element.
   *
   * Purpose: attaches row values such as title, imageUrl, src, description, and actions to parsed selectors.
   * @param {AioRecord} row Flat row.
   * @returns {AioRecord} Element node.
   * @throws Does not throw.
   *
   * @example
   * transformer['rowToElement']({ node: 'h2.title', title: 'Hello' });
   */
  private rowToElement(row: AioRecord): AioRecord {
    // Step 1: Use the last selector segment as the leaf element.
    const selector = String(row.node ?? '');
    const leafSelector = selector.split(this.config.childDelimiter).at(-1) ?? selector;
    const element = this.selectorSegmentToElement(leafSelector);

    // Step 2: Attach row content value to the element.
    const value = this.pickRowValue(row, ['node']);
    if (element.tagName === 'img') element.src = value;
    else if (row.actions) element.onCreated = String(row.actions).split(':')[0];
    else element.content = value;

    // Step 3: Return element node.
    return element;
  }

  /**
   * @method flattenModelNode
   * @summary Recursively flattens a model node into input-style rows.
   *
   * Purpose: converts `output.json` model arrays back into flat row data.
   * @param {AioRecord} node Model node.
   * @param {string} section Current section name.
   * @param {string} [parentSelector] Parent selector path.
   * @param {number[]} [path] Numeric path used for uid generation.
   * @returns {AioRecord[]} Flat rows.
   * @throws Does not throw.
   *
   * @example
   * transformer['flattenModelNode'](model[0], 'gallery');
   */

  private flattenModelNode(node: AioRecord, section: string, parentSelector = '', path: number[] = []): AioRecord[] {
    // Step 1: Flatten array content as nested children.
    if (Array.isArray(node.content)) {
      const selector = this.elementToSelectorSegment(node);
      const currentSelector = selector ? [parentSelector, selector].filter(Boolean).join(this.config.childDelimiter) : parentSelector;
      const rows: AioRecord[] = [];
      node.content.forEach((child, index) => {
        if (this.isRecord(child)) rows.push(...this.flattenModelNode(child, section, currentSelector, [...path, index + 1]));
      });
      return rows;
    }

    // Step 2: Emit a table-like row for non-element records with no selector.
    const selector = this.elementToSelectorSegment(node);
    if (!selector) return [{ ...node, uid: `${section} -${path.join('-') || '1'} `, section }];

    // Step 3: Emit one selector row for leaf element.
    const fullSelector = [parentSelector, selector].filter(Boolean).join(this.config.childDelimiter);
    const row: AioRecord = {
      uid: `${section} -${path.join('-') || '1'} `.replace(/\s+/g, ""),
      section,
      node: fullSelector.replace(/\s+/g, ""),
    };

    // Step 4: Recover content-like values.
    if (node.src) row.src = node.src;
    else if (node.content !== undefined) row.title = node.content;
    if (node.onCreated) row.actions = node.onCreated;

    // Step 5: Return emitted row.
    return [row];
  }

  /**
   * @method selectorSegmentToElement
   * @summary Parses a selector segment into an element object.
   *
   * Purpose: supports selector-to-element conversion.
   * @param {string} selector Selector segment.
   * @returns {AioRecord} Element object.
   * @throws Does not throw.
   *
   * @example
   * transformer['selectorSegmentToElement']('section#hero.row@carousel');
   */
  private selectorSegmentToElement(selector: string): AioRecord {
    // Step 1: Split builder suffix from selector.
    const [rawSelector, builder] = selector.split(this.config.builderDelimiter);
    const normalized = rawSelector.replace(this.config.indexPattern, '');
    const element: AioRecord = {};

    // Step 2: Parse tag, id, classes, and builder.
    const tagName = normalized.match(/^[a-zA-Z][a-zA-Z0-9-]*/)?.[0];
    const id = this.matchToken(normalized, this.config.idPrefix);
    const classes = this.matchTokens(normalized, this.config.classPrefix);
    if (tagName) element.tagName = tagName;
    if (id) element.id = id;
    if (classes.length > 0) element.className = classes.join(' ');
    if (builder) element.builder = builder;

    // Step 3: Return parsed element.
    return element;
  }

  /**
   * @method elementToSelectorSegment
   * @summary Serializes an element object into one selector segment.
   *
   * Purpose: supports model-to-flat selector recovery.
   * @param {AioRecord} node Model node.
   * @returns {string} Selector segment.
   * @throws Does not throw.
   *
   * @example
   * transformer['elementToSelectorSegment']({ tagName: 'h2', className: 'title' });
   */
  private elementToSelectorSegment(node: AioRecord): string {
    // Step 1: Read element fields.
    const tagName = typeof node.tagName === 'string' ? node.tagName : '';
    const id = typeof node.id === 'string' ? `${this.config.idPrefix}${node.id} ` : '';
    const className = typeof node.className === 'string'
      ? node.className.split(/\s+/).filter(Boolean).map((name) => `${this.config.classPrefix}${name} `).join('')
      : '';
    const builder = typeof node.builder === 'string' ? `${this.config.builderDelimiter}${node.builder} ` : '';

    // Step 2: Return selector segment.
    return `${tagName}${id}${className}${builder} `;
  }

  /**
   * @method pickRowValue
   * @summary Picks the best content value from a row without extra schema mapping.
   *
   * Purpose: transfers row payload into output model content.
   * @param {AioRecord} row Row source.
   * @param {string[]} ignored Fields to skip.
   * @returns {unknown} Picked value.
   * @throws Does not throw.
   *
   * @example
   * transformer['pickRowValue'](row, ['node']);
   */
  private pickRowValue(row: AioRecord, ignored: string[] = []): unknown {
    // Step 1: Prefer commonly content-bearing fields when present.
    for (const key of ['title', 'content', 'src', 'imageUrl', 'description', 'value']) {
      if (!(key in row) || ignored.includes(key)) continue;
      if (row[key] !== '') return row[key];
    }

    // Step 2: Fall back to first non-meta field.
    for (const [key, value] of Object.entries(row)) {
      if ([this.config.uidField, this.config.sectionField, 'category', 'timestamp', ...ignored].includes(key)) continue;
      return value;
    }

    // Step 3: Return empty string when no value exists.
    return '';
  }

  /**
   * @method stripInternalRowFields
   * @summary Removes flat-row bookkeeping fields from table content items.
   *
   * Purpose: keeps model table items focused on business fields.
   * @param {AioRecord} row Flat row.
   * @returns {AioRecord} Clean row.
   * @throws Does not throw.
   *
   * @example
   * transformer['stripInternalRowFields'](row);
   */
  private stripInternalRowFields(row: AioRecord): AioRecord {
    // Step 1: Clone row.
    const next = { ...row };

    // Step 2: Remove bookkeeping fields.
    delete next[this.config.uidField];
    delete next[this.config.sectionField];
    delete next.timestamp;

    // Step 3: Return clean row.
    return next;
  }

  /**
   * @method splitList
   * @summary Splits a delimited string into an array.
   *
   * Purpose: supports `ARRAY_TO_STRING` and `ARRAY_CHILD_KEY`.
   * @param {unknown} value Value to split.
   * @returns {unknown} Array or original value.
   * @throws Does not throw.
   *
   * @example
   * transformer['splitList']('a, b');
   */

  private splitList(value: unknown): unknown {
    // Step 1: Return non-string values unchanged.
    if (typeof value !== 'string') return value;

    // Step 2: Split, trim, and remove empty items.
    return value.split(this.config.listDelimiter).map((item) => item.trim()).filter(Boolean);
  }

  /**
   * @method joinList
   * @summary Joins an array into a delimited string.
   *
   * Purpose: reverses list transforms.
   * @param {unknown} value Value to join.
   * @returns {unknown} String or original value.
   * @throws Does not throw.
   *
   * @example
   * transformer['joinList'](['a', 'b']);
   */
  private joinList(value: unknown): unknown {
    // Step 1: Return non-array values unchanged.
    if (!Array.isArray(value)) return value;

    // Step 2: Join array values.
    return value.map((item) => this.isRecord(item) ? JSON.stringify(item) : String(item)).join(this.config.outputListDelimiter);
  }

  /**
   * @method setPath
   * @summary Sets a nested path on an object.
   *
   * Purpose: supports `NESTED_OBJECT` pointer folding.
   * @param {AioRecord} target Object to mutate.
   * @param {string} path Path string.
   * @param {unknown} value Value to set.
   * @returns {void} Mutates target.
   * @throws Does not throw.
   *
   * @example
   * transformer['setPath'](row, 'artwork.fullbody', 'a.png');
   */
  private setPath(target: AioRecord, path: string, value: unknown): void {
    // Step 1: Split path into keys.
    const keys = path.split(this.config.pathDelimiter).filter(Boolean);
    let current = target;

    // Step 2: Create intermediate objects and set final value.
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
        return;
      }
      if (!this.isRecord(current[key])) current[key] = {};
      current = current[key] as AioRecord;
    });
  }

  /**
   * @method hasType
   * @summary Checks whether the current metadata uses a transform type.
   *
   * Purpose: gates structural transform stages.
   * @param {AioTransformType} type Transform type.
   * @returns {boolean} True when type exists.
   * @throws Does not throw.
   *
   * @example
   * transformer['hasType']('SELECTOR_TO_ELEMENT');
   */
  private hasType(type: AioTransformType): boolean {
    // Step 1: Check current type map values.
    return Object.values(this.types).includes(type);
  }

  /**
   * @method matchToken
   * @summary Matches one prefixed selector token.
   *
   * Purpose: parses configurable id/class selectors.
   * @param {string} value Selector string.
   * @param {string} prefix Prefix marker.
   * @returns {string | undefined} Token.
   * @throws Does not throw.
   *
   * @example
   * transformer['matchToken']('section#hero', '#');
   */

  private matchToken(value: string, prefix: string): string | undefined {
    // Step 1: Build escaped regex and return first capture.
    return value.match(new RegExp(`${this.escapeRegExp(prefix)} ([a - zA - Z0 -9_ -] +)`))?.[1];
  }

  /**
   * @method matchTokens
   * @summary Matches all prefixed selector tokens.
   *
   * Purpose: parses multiple classes.
   * @param {string} value Selector string.
   * @param {string} prefix Prefix marker.
   * @returns {string[]} Tokens.
   * @throws Does not throw.
   *
   * @example
   * transformer['matchTokens']('.a.b', '.');
   */
  private matchTokens(value: string, prefix: string): string[] {
    // Step 1: Build escaped global regex and return captures.
    return Array.from(value.matchAll(new RegExp(`${this.escapeRegExp(prefix)} ([a - zA - Z0 -9_ -] +)`, 'g'))).map((match) => match[1]);
  }

  /**
   * @method stringifyCell
   * @summary Converts a value into a table cell string.
   *
   * Purpose: supports `toTableNode`.
   * @param {unknown} value Value to stringify.
   * @returns {string} Cell string.
   * @throws {TypeError} Throws for circular JSON values.
   *
   * @example
   * transformer['stringifyCell']({ a: 1 });
   */
  private stringifyCell(value: unknown): string {
    // Step 1: Handle empty and primitive values.
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);

    // Step 2: Serialize complex values.
    return JSON.stringify(value);
  }

  /**
   * @method cloneRows
   * @summary Creates shallow copies of rows.
   *
   * Purpose: avoids mutating caller input.
   * @param {AioRecord[]} rows Rows to clone.
   * @returns {AioRecord[]} Cloned rows.
   * @throws Does not throw.
   *
   * @example
   * transformer['cloneRows']([{ uid: 'a' }]);
   */
  private cloneRows(rows: AioRecord[]): AioRecord[] {
    // Step 1: Clone row objects.
    return rows.map((row) => ({ ...row }));
  }

  /**
   * @method slug
   * @summary Converts text into a lowercase id-safe slug.
   *
   * Purpose: generates stable-ish section ids during flattening.
   * @param {string} value Source text.
   * @returns {string} Slug.
   * @throws Does not throw.
   *
   * @example
   * transformer['slug']('Hero Section');
   */
  private slug(value: string): string {
    // Step 1: Normalize text into simple slug.
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  }

  /**
   * @method toTitleCase
   * @summary Converts a section key into a title-like name.
   *
   * Purpose: supplies model `name` when no container title exists.
   * @param {string} value Source value.
   * @returns {string} Title-like value.
   * @throws Does not throw.
   *
   * @example
   * transformer['toTitleCase']('product-list');
   */
  private toTitleCase(value: string): string {
    // Step 1: Replace separators and capitalize words.
    return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * @method escapeRegExp
   * @summary Escapes regex metacharacters.
   *
   * Purpose: safely builds regexes from configurable selector prefixes.
   * @param {string} value Raw string.
   * @returns {string} Escaped string.
   * @throws Does not throw.
   *
   * @example
   * transformer['escapeRegExp']('.');
   */
  private escapeRegExp(value: string): string {
    // Step 1: Escape regex metacharacters.
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * @method isRecord
   * @summary Checks whether a value is a non-array object.
   *
   * Purpose: narrows unknown values before dynamic object access.
   * @param {unknown} value Value to check.
   * @returns {value is AioRecord} True for object records.
   * @throws Does not throw.
   *
   * @example
   * if (transformer['isRecord'](value)) console.log(value);
   */
  private isRecord(value: unknown): value is AioRecord {
    // Step 1: Accept non-null objects and reject arrays.
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}