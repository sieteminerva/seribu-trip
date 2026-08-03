import {
  __applyTableClasses,
  __normalizeCell,
  __applyCellOptions,
  __applyFormula,
  __applyRowFormula,
  __findColIndexByHeader,
  __parseValue,
  __formatValue,
  __getRowData,
  __countVisibleSubRowsByUid,
  __computeRowTotalValue,
  __getHeaderGroupNames,
  tcell,
  __bindSortListener,
  __calculateRow,
  type TableRowModel,
  type TableConfig,
  type TableData,
  type DOMModel,
  type TableCellData,
  type TableCellModel,
} from "./Table.helper";

import "./Table.css";
/**
 * @classdesc
 * TableBuilder is a class that facilitates the creation, manipulation, and rendering
 * of HTML tables using a DOM model approach.
 * It supports features such as:
 * - pagination,
 * - sub-rows,
 * - editable cells,
 * - formula calculations,
 * - and dynamic UI updates.
 * The class provides an API for adding, inserting, removing, and sorting rows, as well as
 * switching between pages in a paginated table.
 *
 * TableBuilder — DOMModel based table builder
 * @example
 *  // Create Table
 *
 *  const tb = new TableBuilder(data, config);
 *  // or
 *  const tb = createTableElement(data, config);
 *
 *  const container = document.createElement("div");
 *  const tableElement = tb.create();
 *  container.append(tableElement);
 *
 * ========== Public API ==========
 *
 * @example
 *  // Listen to Change Event
 *
 *  tb.changed((data, meta) => ...);
 *
 * @example
 *  // Adding New Row
 *
 *  tb.addRow([...]);
 *
 * @example
 *  // Insert Subrow
 *
 *  tb.insertSubRow([...], parentIndex);
 *
 * @example
 *  // Remove Row
 *
 *  tb.removeRow(globalIndex);
 *
 * @example
 *  // Change Page
 *
 *  tb.switchPage(pageNumber);
 *
 * @example
 *  // Get Data
 *
 *  tb.getData({ includeMeta });
 *
 * @todo
 * - add property to row options, `disable editing` - to mark editing feature is disabled for that row.
 * - create destroy method
 */

/** Internal data shape used by TableBuilder — body rows may be plain arrays or sub-row objects */
interface InternalTableData {
  header: any[];
  body: any[];
  footer: any;
}

export class TableBuilder {
  // Types are imported from "./table-builder.helper":
  // TableCellOptions, TableCellData, TableCellValue, TableCellModel,
  // TableRowOptions, TableRowModel, TableFooterOptions, TableConfig,
  // TableData, DOMModel

  /**
   * @description Creates an instance of TableBuilder.
   * This constructor initializes the table's data, configuration, internal state,
   * DOM containers, and event listeners. It also performs an initial render of the table.
   *
   * @param {TableData} data - The initial data for the table.
   *   - `header`: An array of header cell values or `TableCellData` objects.
   *   - `body`: An array of body row values or `TableCellData` objects.
   *   - `footer`: Footer content, which can be an array, `HTMLElement`, or string.
   * @param {TableConfig} [config={}] - The configuration object for the table.
   *
   * @summary
   * 1. **Data Storage**: Stores a shallow copy of the provided `data` (header, body, footer).
   * 2. **Configuration Defaults**: Merges the provided `config` with default settings for various table properties.
   * 3. **Internal State Initialization**: Sets up internal variables like `currentPage`, `pageRows`,
   *    `_uidCounter`, and a `_generateRowUID` function for unique row identifiers.
   * 4. **DOM Container Creation**: Creates the main `</table>` element and initializes references for `[thead]`, `[tbody]`, and `[tfoot]`.
   * 5. **Event Listeners**: Initializes an empty array `_listeners` to hold change event callbacks.
   * 6. **DOMModel Initialization**: Sets up an empty `domModel` object which will hold the structured representation
   *    of the table's DOM elements.
   * 7. **Apply Table Classes**: Calls a helper function `__applyTableClasses` to apply CSS classes to the `[table]` element based on `config`.
   * 8. **Internal Render Variables**: Initializes `_isRowTotalRendered` and `_totalColumns` which are used during the rendering process.
   * 9. **Initial Render**: Calls the `render()` method to build and display the table for the first time.
   *
   * @example
   * const data = {
   *   header: ["Name", "Age"],
   *   body: [["Alice", 30], ["Bob", 24]],
   *   footer: "Total: 2 rows"
   * };
   * const config = {
   *   size: "small",
   *   editable: true,
   *   autoNumbering: true
   * };
   * const tableBuilder = new TableBuilder(data, config);
   * document.getElementById("table-container").appendChild(tableBuilder.create());
   *
   */

  /**
   * @property {InternalTableData} data
   * @description
   * the table data
   *
   */
  data: InternalTableData;

  /**
   * @property {TableConfig} config
   * @description
   * default table config
   *
   */
  config: TableConfig;
  /**
   * @property {HTMLTableElement} table
   * @description
   * table element
   *
   */
  table: HTMLTableElement;
  /**
   * @property {HTMLTableSectionElement | null} thead
   * @description
   * table head
   *
   */
  thead: HTMLTableSectionElement | null = null;
  /**
   * @property {HTMLTableSectionElement | null} tbody
   * @description
   * table body
   *
   */
  tbody: HTMLTableSectionElement | null = null;
  /**
   * @property {HTMLTableSectionElement | null} tfoot
   * @description
   * table footer
   *
   */
  tfoot: HTMLTableSectionElement | null = null;
  /**
   * @property {DOMModel} domModel
   * @description
   * dom model for building a table element
   *
   */
  domModel: DOMModel;

  /**
   * @property {number} currentPage
   * @description
   * current page if `config.pageSize` defined
   *
   */
  currentPage: number;
  /**
   * @property {any[]} pageRows
   * @description
   * table body data splice to `config.pageSize`
   *
   */
  pageRows: any[];
  _uidCounter: number;
  _generateRowUID: () => string;
  _listeners: ((data: any, detail: any) => void)[];
  _isRowTotalRendered: boolean;

  /**
   * @property {number | null} _totalColumns
   * @description
   * total count of rendered cells
   *
   */
  _totalColumns: number | null = null;

  constructor(data: TableData, config: TableConfig = {}) {
    // store raw inputs

    this.data = {
      header: Array.isArray(data.header) ? (data.header as any[]).slice() : [],
      body: Array.isArray(data.body) ? (data.body as any[]).slice() : [],
      footer: Array.isArray(data.footer) ? (data.footer as any[]).slice() : data.footer || null,
    };

    // defaults
    this.config = Object.assign(
      {
        size: null,
        type: null,
        color: null,
        textAlign: null,
        sortable: false,
        selectable: false,
        editable: true,
        autoNumbering: true,
        pageSize: 8,
        disableSubRow: true,
        headerOptions: {},
        bodyOptions: [],
        footerOptions: {},
      },
      config || {}
    );

    // Step 1: Initialize internal state variables.
    this.currentPage = 1;

    this.pageRows = [];
    this._uidCounter = 0;
    this._generateRowUID = () => `row_${++this._uidCounter}`;

    // Step 2: Create main DOM containers for the table.
    this.table = document.createElement("table");

    // Step 3: Initialize an array to store event listeners.
    this._listeners = [];

    // Step 4: Initialize the DOMModel structure.
    this.domModel = { header: [], body: [], footer: [] };

    // Step 5: Apply CSS classes to the table element based on the configuration.
    __applyTableClasses(this.table, config);

    // Step 6: Initialize internal variables used during the rendering process.
    this._isRowTotalRendered = false;

    // Step 7: Perform the initial render of the table.
    this.render();
  }

  // ---------------------- Public API ----------------------

  /**
   * @public
   * @method create
   *
   * @description
   * Returns the main HTML table element.
   * @returns {HTMLTableElement} The constructed HTML table element.
   */
  create(): HTMLTableElement {
    return this.table;
  }

  /**
   * @public
   * @method render
   *
   * @description
   * Render the table, it also can be use to refresh the rendered table
   *
   * @return {*}
   * @memberof TableBuilder
   */
  render(): HTMLTableElement {
    // 1) process data (normalize + build DOMModel)
    // Step 1: Process the raw data to create an internal DOM model.
    this.domModel = this._processData();

    // 2) build DOM sections
    // Step 2: Clear existing table content and render header, body, and footer sections.
    this.table.innerHTML = "";
    this.thead = this._renderHeader(this.domModel.header);
    this.tbody = this._renderBody(this.domModel.body);
    this.tfoot = this._renderFooter(this.domModel.footer);

    // Step 3: Return the fully rendered table element.
    return this.table;
  }

  // TODO implements destroy method
  destroy(): void { }

  /**
   * @public
   * @method getData
   *
   * @description
   * Return current data (optionally include metadata like subrowOf)
   * @param {Object} [opts = {includeMeta=false}]
   * @returns {TableData} The current table data.
   * @example
   *
   * const currentData = tableBuilder.getData({ includeMeta: true });
   * console.log(currentData.body[0].subrowOfUid);
   *
   */
  getData({ includeMeta = false }: { includeMeta?: boolean } = {}): { header: any[]; body: any[]; footer: any[] } {
    const header = this.data.header.slice();
    const body = this.data.body.map((r) => {
      if (!includeMeta) {
        return Array.isArray(r)
          ? r.map((v) => (v && typeof v === "object" && v.text ? v.text : v)).slice()
          : r.data && Array.isArray(r.data)
            ? r.data.map((dv: TableCellData) => (dv && dv.text ? dv.text : dv)).slice()
            : [];
      } else {
        if (Array.isArray(r)) return r.slice();
        return includeMeta ? { subrowOfUid: r.subrowOfUid, data: r.data.slice() } : r.data.slice();
      }
    });
    const footer = this.data.footer ? this.data.footer.slice() : [];
    return { header, body, footer };
  }

  /**
   * @public
   * @method changed
   *
   * @description
   * Registers a callback function to be invoked when the table's data changes.
   *
   * @param {function(Object, Object): void} cb - The callback function. It receives two arguments:
   *   - `data`: The current table data, including metadata.
   *   - `meta`: An object describing the change (e.g., `{ type: "add", rowIndex: 0 }`).
   * @returns {void}
   * @example
   *
   * tableBuilder.changed((data, meta) => {
   *   console.log("Table data changed:", meta.type, data);
   * });
   *
   */
  changed(cb: (data: any, detail: any) => void): void {
    // Step 1: Check if the provided callback is a function.
    if (typeof cb === "function") this._listeners.push(cb);
    // Step 2: Add the callback to the list of listeners.
  }
  /**
   * @private
   * @method _emitChange
   *
   * @param {*} detail
   * @memberof TableBuilder
   */
  _emitChange(detail: Record<string, any>): void {
    for (const cb of this._listeners) {
      try {
        // Step 1: Invoke each registered listener callback.
        cb(this.getData({ includeMeta: true }), detail);
      } catch (err) {
        // Step 2: Log any errors that occur within a listener to prevent disruption.
        console.error("TableBuilder listener error:", err);
      }
    }
  }
  /**
   * @public
   * @method sort
   * @todo finish the implementations
   *
   * @param {*} propertyName
   * @memberof TableBuilder
   */
  sort(propertyName: string): void {
    this.domModel.body.sort((a: any, b: any) => a[propertyName] - b[propertyName]);
  }

  // ---------------------- Data operation / mutation helpers ----------------------
  /**
   * @public
   * @method addRow
   *
   * @description
   * Adds a new row to the table's data model and re-renders the table.
   * If `pageSize` is configured, it automatically switches to the last page to show the new row.
   * The newly added row is then opened for editing.
   *
   * @param {Array<any>|null} [inputRowData=null] - An array of cell values for the new row.
   *   If `null` or shorter than the header, empty strings will be used for missing cells.
   * @returns {void}
   *
   * @example
   *
   * // Add a new row with specific data
   * tableBuilder.addRow(["New Item", 100, "Active"]);
   *
   * // Add an empty new row
   * tableBuilder.addRow();
   *
   *
   * @summary
   * 1. Normalizes the `inputRowData` to match the table's column count.
   * 2. Pushes the new row into `this.data.body`.
   * 3. If pagination is active, updates `currentPage` to the last page.
   * 4. Triggers a full re-render of the table.
   * 5. Calls `_openRowForEditByGlobalIndex` to put the new row into edit mode.
   * 6. Emits a "change" event with type "add".
   */
  addRow(inputRowData: TableCellData[] | null = null): void {
    // Step 1: Determine the number of columns based on the header length.
    // This ensures that new rows have the correct number of cells, even if inputRowData is shorter.
    // If inputRowData is null or shorter than the header, fill missing cells with empty strings.
    const cols = Math.max(0, this.data.header.length);
    const newRow = Array.isArray(inputRowData)
      ? inputRowData.slice(0, cols).concat(Array(Math.max(0, cols - inputRowData.length)).fill(""))
      : Array(cols).fill("");
    this.data.body.push(newRow);

    if (this.config.pageSize) {
      // Step 2: If pagination is enabled, calculate the total number of pages
      // and set the current page to the last page to ensure the new row is visible.
      const pages = Math.ceil(this.data.body.length / this.config.pageSize);
      this.currentPage = pages;
    }

    // Step 3: Determine the global index of the newly added row.
    const newGlobalIndex = this.data.body.length - 1;
    // Step 4: Re-render the entire table to reflect the changes.
    this.render();
    // Step 5: Open the newly added row for editing.
    this._openRowForEditByGlobalIndex(newGlobalIndex);
    // Step 6: Emit a "change" event to notify listeners about the row addition.
    this._emitChange({ type: "add", rowIndex: newGlobalIndex });
  }

  /**
   * @public
   * @method insertSubRow
   *
   * @description
   * Inserts a new sub-row associated with a parent row at a specific global index.
   * The sub-row is inserted immediately after the parent row and any existing sub-rows of that parent.
   * The newly inserted sub-row is then opened for editing.
   *
   * @param {Array<any>|null} [inputRowData=null] - An array of cell values for the new sub-row.
   *   If `null` or shorter than the header, empty strings will be used for missing cells.
   * @param {number} [parentIndex] - The global index of the parent row to which this sub-row belongs.
   * @returns {void}
   * @throws {Error} If `parentIndex` is invalid or the parent row does not exist.
   *
   * @example
   *
   * // Assuming a parent row exists at global index 2
   * tableBuilder.insertSubRow(["Sub-item A", 50], 2);
   *
   *
   * @summary
   * 1. Normalizes the `inputRowData` to match the table's column count.
   * 2. Ensures the parent row has a unique UID (`_uid`) and assigns it to the new sub-row's `subrowOfUid`.
   * 3. Determines the correct insertion point for the sub-row (after the parent and its existing sub-rows).
   * 4. Splices the new sub-row into `this.data.body`.
   * 5. Triggers a full re-render of the table.
   * 6. Calls `_openRowForEditByGlobalIndex` to put the new sub-row into edit mode.
   * 7. Emits a "change" event with type "add-subrow".
   */
  insertSubRow(inputRowData: any[] | null = null, parentIndex: number): void {
    const cols = Math.max(0, this.data.header.length);
    const normalized = Array.isArray(inputRowData)
      ? inputRowData.slice(0, cols).concat(Array(Math.max(0, cols - inputRowData.length)).fill(""))
      : Array(cols).fill("");

    // Step 1: Ensure parent has uid and get its UID.
    // ensure parent has uid
    const parent = this.data.body[parentIndex];
    if (!parent) throw new Error("insertSubRow: invalid parentIndex");
    if (!parent._uid) parent._uid = this._generateRowUID();
    const parentUid = parent._uid;

    const newSubRow = { subrowOfUid: parentUid, data: normalized, _uid: this._generateRowUID() };
    // Step 2: Find the correct insertion index for the new sub-row.
    // find insert index after existing subrows for that parent
    let insertIndex = parentIndex + 1;
    while (insertIndex < this.data.body.length && this.data.body[insertIndex]?.subrowOfUid === parentUid) {
      insertIndex++;
    }

    // Step 3: Insert the new sub-row into the data model.
    this.data.body.splice(insertIndex, 0, newSubRow);

    // Step 4: Re-render the table to display the new sub-row.
    // open for edit
    this.render();
    // Step 5: Open the newly inserted sub-row for editing.
    this._openRowForEditByGlobalIndex(insertIndex);

    // Step 6: Emit a "change" event to notify listeners about the sub-row addition.
    this._emitChange({ type: "add-subrow", parentIndex, rowIndex: insertIndex });
  }

  /**
   * @public
   * @method removeRow
   *
   * @description
   * Removes a row from the table's data model at a specified global index.
   * If the removed row is a parent row (has a UID), all its associated sub-rows are also removed.
   * The table is then re-rendered, and pagination is adjusted if necessary.
   *
   * @param {number} globalIndex - The global index of the row to be removed.
   * @returns {void}
   *
   * @example
   *
   * // Remove the row at global index 3
   * tableBuilder.removeRow(3);
   *
   *
   * @summary
   * 1. Validates the `globalIndex`.
   * 2. If the target row is a parent, it iterates backward from the end of the `body` array
   *    to remove all sub-rows linked to that parent's UID.
   * 3. Removes the target parent row itself.
   * 4. Adjusts `currentPage` if the removal causes the current page to become empty or exceed the new page count.
   * 5. Triggers a full re-render of the table.
   * 6. Emits a "change" event with type "remove".
   */
  removeRow(globalIndex: number): void {
    if (globalIndex < 0 || globalIndex >= this.data.body.length) return;

    const target = this.data.body[globalIndex];
    const parentUid = target && target._uid;

    // if parent has uid, remove all subrows that reference it first
    // Step 1: If the row to be removed is a parent, remove all its sub-rows first.
    if (parentUid) {
      // remove from the end to avoid reindexing issues
      for (let i = this.data.body.length - 1; i > globalIndex; i--) {
        const r = this.data.body[i];
        if (r && typeof r === "object" && r.subrowOfUid === parentUid) {
          this.data.body.splice(i, 1);
        }
      }
    }

    // Step 2: Remove the target row itself from the data model.
    // finally remove the parent
    this.data.body.splice(globalIndex, 1);

    // Step 3: Adjust pagination if the table is paginated.
    // adjust pagination
    if (this.config.pageSize) {
      const pages = Math.max(1, Math.ceil(this.data.body.length / this.config.pageSize));
      if (this.currentPage > pages) this.currentPage = pages;
    }

    // Step 4: Re-render the table to reflect the removal.
    this.render();
    // Step 5: Emit a "change" event to notify listeners about the row removal.
    this._emitChange({ type: "remove", rowIndex: globalIndex });
  }

  /**
   * @public
   * @method switchPage
   *
   * @description
   * Switches the current page of the table if pagination is enabled.
   * The table is re-rendered to display the rows of the new page.
   *
   * @param {number} pageNumber - The page number to switch to (1-indexed).
   * @returns {void}
   *
   * @example
   *
   * // Switch to the second page
   * tableBuilder.switchPage(2);
   *
   *
   * @summary
   * 1. Validates the `pageNumber` against the total number of available pages.
   * 2. Updates `this.currentPage` to the new page number.
   * 3. Triggers a full re-render of the table.
   * 4. Emits a "change" event with type "pagechange", including the new page number and its rows.
   */
  switchPage(pageNumber: number): void {
    const pages = this.config.pageSize ? Math.max(1, Math.ceil(this.data.body.length / this.config.pageSize)) : 1;
    if (pageNumber < 1 || pageNumber > pages) return;
    this.currentPage = pageNumber;
    this.render();
    this._emitChange({ type: "pagechange", pageNumber: this.currentPage, pageRows: this.pageRows });
  }
  // ---------------------- Builder ------------------------

  /**
   * @private
   * @method _createHeaderDomModel
   *
   * @description
   * Creates a DOM model for the table header based on the provided header input and configuration.
   * It supports both single-row headers and grouped headers (which result in two rows).
   *
   * @param {Array<any|TableCellData>} headerInput - The raw header data provided to the TableBuilder.
   *   Each item can be a string, HTMLElement, or an object with `text`, `options`, and `group` properties.
   * @param {TableConfig} config - The table configuration object, specifically `config.headerOptions`.
   * @returns {TableRowModel[]} An array of header row models, each containing an array of `tcell` objects.
   *
   * @example
   *
   * // Example with a simple single-row header:
   * const headerInput = ["Name", "Age", { text: "City", options: { color: "blue" } }];
   * const config = { headerOptions: { textAlign: "center" } };
   * const headerDomModel = this._createHeaderDomModel(headerInput, config);
   * // headerDomModel will contain one TableRowModel with three tcell objects.
   *
   *
   * @example
   *
   * // Example with grouped headers (will produce two rows):
   * const headerInput = [
   *   { text: "ID" },
   *   { text: "First Name", group: "Personal Info" },
   *   { text: "Last Name", group: "Personal Info" },
   *   { text: "Email", group: "Contact" }
   * ];
   * const config = {};
   * const headerDomModel = this._createHeaderDomModel(headerInput, config);
   *
   * // headerDomModel will contain two TableRowModels:
   * // - The first row will have "ID", "Personal Info" (colspan 2), and "Contact" (colspan 1).
   * // - The second row will have "First Name", "Last Name", and "Email".
   *
   *
   * @summary
   * 1. **Normalize Header Input**: Converts various input formats (string, HTMLElement, object)
   *    into a consistent `TableCellData` structure, adding `sourceIndex` and `group` properties.
   * 2. **Detect Grouping**: Checks if any `group` property is present in the normalized headers.
   * 3. **Single-Row Header**: If no groups are detected, it creates a single `TableRowModel`
   *    where each `tcell` corresponds to an input header, applying `config.headerOptions`.
   * 4. **Grouped Headers**: If groups are detected:
   *    - It processes the normalized headers to identify distinct groups and standalone headers.
   *    - It then constructs two `TableRowModel` objects:
   *      - `topRow`: Contains group names (with `colspan` for grouped items) and standalone headers (with `rowspan` 2).
   *      - `bottomRow`: Contains the individual headers that belong to a group.
   * 5. **Return Header Rows**: Returns an array containing one or two `TableRowModel` objects.
   */
  _createHeaderDomModel(headerInput: any[], config: TableConfig): TableRowModel[] {
    const normalized = (headerInput || []).map((h, i) => {
      if (h == null) return { text: "", options: {}, group: null, sourceIndex: i };
      if (h instanceof HTMLElement) return { text: h, options: {}, group: null, sourceIndex: i };
      if (typeof h === "object") {
        return { text: h.text ?? "", options: h.options ?? {}, group: h.group ?? null, sourceIndex: i };
      }
      return { text: String(h), options: {}, group: null, sourceIndex: i };
    });

    // Step 1: Normalize header input and detect if any groups are present.
    const hasGroup = normalized.some((n) => n.group != null);

    if (!hasGroup) {
      return [
        // Step 2: If no groups, create a single header row.
        {
          cells: normalized.map((cell) =>
            tcell(`col${cell.sourceIndex}`).value(cell.text).options(config.headerOptions, cell.options).create()
          ),
        },
      ];
    }

    // Step 3: If grouped headers exist, process them into two rows.
    const groups = [];
    for (const cell of normalized) {
      if (cell.group) {
        const last = groups[groups.length - 1];
        if (last && !last.isStandalone && last.name === cell.group) {
          last.span += 1;
          last.items.push(cell);
        } else {
          groups.push({ name: cell.group, span: 1, items: [cell], isStandalone: false });
        }
      } else {
        groups.push({ name: cell.text, span: 1, items: [cell], isStandalone: true });
      }
    }

    // Step 4: Initialize top and bottom rows for grouped headers.
    const topRow = { rowIndex: 0, cells: [] as TableCellModel[] };
    const bottomRow = { rowIndex: 1, cells: [] as TableCellModel[] };

    for (const g of groups) {
      // Step 5: Populate top and bottom rows based on group type (standalone or grouped).
      if (g.isStandalone) {
        const child = g.items[0];
        topRow.cells.push(
          tcell(`col${child.sourceIndex}`)
            .value(child.text)
            .rowspan("2")
            .options(config.headerOptions, child.options)
            .create()
        );
      } else {
        topRow.cells.push(
          tcell(`group-${g.name}-${topRow.cells.length}`)
            .value(g.name)
            .class("parent-title")
            .colspan(g.span)
            .options(config.headerOptions)
            .create()
        );
        g.items.forEach((child) => {
          bottomRow.cells.push(
            tcell(`col${child.sourceIndex}`)
              .value(child.text)
              .class("child-title")
              .options(config.headerOptions, child.options)
              .create()
          );
        });
      }
    }

    // Step 6: Return the two header rows.
    return [topRow, bottomRow];
  }

  /**
   * @private
   * @method _createBodyDomModel
   *
   * @description
   * Creates a DOM model for the table body based on the provided body input and configuration.
   * It handles pagination, sub-rows, and applies cell formatting and formulas.
   *
   * @param {Array<any|TableCellData>} bodyInput - The raw body data provided to the TableBuilder.
   * @param {TableConfig} config - The table configuration object.
   * @returns {TableRowModel[]} An array of body row models, each containing an array of body cells.
   *
   * @example
   *
   * // Example body input
   * const bodyInput = [
   *   ["Item 1", 100],
   *   { subrowOfUid: "row_1", data: ["Sub-item A", 50] },
   *   ["Item 2", 200]
   * ];
   * const config = {
   *   pageSize: 10,
   *   bodyOptions: [{ format: "text" }, { format: "number", formula: "A * 2" }]
   * };
   * const bodyDomModel = this._createBodyDomModel(bodyInput, config);
   * // bodyDomModel will contain BodyRowModel objects for the current page,
   * // with cells normalized, formatted, and formulas applied.
   *
   *
   * @summary
   * 1. **Pagination Slice**: Determines the `start` and `end` indices for the current page's rows
   *    if `pageSize` is configured.
   * 2. **Iterate and Normalize Rows**: Loops through the relevant slice of `bodyInput`.
   *    - For each row, it checks if it's a sub-row (object with `subrowOfUid`).
   *    - Ensures each raw row has a unique `_uid`.
   *    - Stores the normalized row data in `this.pageRows`.
   * 3. **Process Cells**: For each cell within a row:
   *    - Normalizes the cell value using `__normalizeCell`.
   *    - Retrieves the corresponding header for formula calculation.
   *    - Creates a `tcell` object with the normalized value and applies `bodyOptions`.
   *    - If a `formula` is defined in `bodyOptions` for that column, it applies `__applyRowFormula`
   *      to calculate the cell's value and updates the `normalizedRow` data.
   * 4. **Construct BodyRowModel**: Creates a `BodyRowModel` object for each processed row,
   *    including its `rowIndex`, `uid`, `parentUid` (if a sub-row), the array of `cells`,
   *    and `rowOptions`.
   * 5. **Return Body DOM Model**: Returns the array of `BodyRowModel` objects for the current page.
   */
  _createBodyDomModel(bodyInput: any[], config: TableConfig): TableRowModel[] {
    // console.log("_createBodyDomModel > bodyInput:", bodyInput);
    const pageSize = config.pageSize;
    const start = pageSize ? (this.currentPage - 1) * pageSize : 0;
    const end = pageSize ? Math.min(bodyInput.length, start + pageSize) : bodyInput.length;

    const body = [];
    this.pageRows = [];

    let displayIndex = 0;
    for (let i = 0; i < start; i++) {
      const raw = bodyInput[i];
      const isSubRow = raw && typeof raw === "object" && raw.subrowOfUid != null;
      if (!isSubRow) displayIndex += 1;
    }

    for (let i = start; i < end; i++) {
      // Step 1: Get the raw row data and determine if it's a sub-row.
      const raw = bodyInput[i];
      const isSubRow = raw && typeof raw === "object" && raw.subrowOfUid != null;
      const normalizedRow = isSubRow ? raw.data : raw;

      // Step 2: Ensure the raw row has a unique UID and store its data for the current page.
      if (!raw._uid) raw._uid = this._generateRowUID();
      const uid = raw._uid;

      this.pageRows.push(Array.isArray(normalizedRow) ? normalizedRow : []);

      const cells = [];
      const dataColsCount = Math.max(0, (this.data.header || []).length);

      // Step 3: Process each cell in the row.
      for (let ci = 0; ci < dataColsCount; ci++) {
        const rawCell = Array.isArray(normalizedRow) ? normalizedRow[ci] : undefined;
        const norm = __normalizeCell(rawCell);
        const headerTitle = typeof this.data.header[ci] === "string" ? this.data.header[ci] : this.data.header[ci].text; // <= this will be used to generate and calculate footer render total
        // Step 3a: Create a tcell object for the current cell.
        cells.push(
          tcell(`col${ci}`).header(headerTitle).value(norm.text).options({ ...(config.bodyOptions?.[ci] || {}), ...norm.options }).create()
        );
        // apply calculation for the row using formula if defined
        if (config.bodyOptions && config.bodyOptions[ci] && config.bodyOptions[ci].formula) {
          __applyRowFormula(cells, ci, config.bodyOptions[ci].formula as string);
          normalizedRow[ci] = cells[ci].value;
        }
      }

      const autoNumber = isSubRow ? 0 : ++displayIndex;

      // Step 4: Construct and add the BodyRowModel to the body array.
      body.push({
        autoNumber,
        rowIndex: i,
        uid: uid,
        parentUid: raw.subrowOfUid || null,
        cells,
        rowOptions: isSubRow ? raw.rowOptions || {} : {},
      });
    }
    // Step 5: Return the array of BodyRowModel objects.
    // console.log({ body });
    return body;
  }

  /**
   * @private
   * @method _createFooterDomModel
   *
   * @description
   * Creates a DOM model for the table footer, incorporating various footer elements
   * such as render totals, custom footer content, and pagination controls.
   * It uses placeholders which are later replaced by actual DOM elements in `_applyInsertion*` methods.
   *
   * @param {any|TableCellData[]} footerInput - The raw footer data provided to the TableBuilder.
   * @param {TableConfig} config - The table configuration object.
   * @returns {TableRowModel[]|null} An array of footer row models, or `null` if no footer elements are needed.
   *
   * @example
   *
   * // Example with renderTotal and editable
   * const footerInput = null;
   * const config = {
   *   editable: true,
   *   footerOptions: { renderTotal: ["Amount"] },
   *   autoNumbering: true
   * };
   * const footerDomModel = this._createFooterDomModel(footerInput, config);
   * // footerDomModel will contain a row with a "render-total-Amount" placeholder
   * // and an "add-button" placeholder.
   *
   * // Example with custom footer content and pagination
   * const customFooter = "End of Report";
   * const configWithPagination = {
   *   pageSize: 5,
   *   footer: customFooter
   * };
   * const footerDomModelWithPagination = this._createFooterDomModel(customFooter, configWithPagination);
   * // footerDomModelWithPagination will contain two rows:
   * // - One row with the custom footer content.
   * // - One row with a "pagination" placeholder.
   *
   *
   * @summary
   * 1. **Check for Footer Elements**: Determines if any footer elements (custom footer, render totals,
   *    editable actions, or pagination) are configured. If not, returns `null`.
   * 2. **Render Total Row**: If `footerOptions.renderTotal` is an array:
   *    - Creates a new row.
   *    - Fills it with empty placeholders for all columns.
   *    - Replaces specific column placeholders with `render-total-{title}` placeholders for each
   *      item in `renderTotal`.
   *    - If `editable` is true, adds an `add-button` placeholder to the last column.
   * 3. **Custom Footer Row**: If `footerInput` is provided:
   *    - Creates a new row.
   *    - If `footerInput` is an array, fills cells directly.
   *    - If `footerInput` is an HTMLElement or string, creates a single cell spanning all columns.
   * 4. **Pagination Row**: If `pageSize` is configured:
   *    - Creates a new row.
   *    - Adds a `pagination` placeholder, spanning appropriate columns.
   *    - If `editable` is true and an add button hasn't been placed yet, adds an `add-button` placeholder.
   * 5. **Return Footer DOM Model**: Returns the array of constructed footer row models.
   */
  _createFooterDomModel(footerInput: any, config: TableConfig): TableRowModel[] | null {
    const { editable, pageSize, autoNumbering, footerOptions } = config;
    let footer = [];
    if (!footerInput && !footerOptions?.renderTotal && !editable && !pageSize) return null;

    let addButtonPlaced = false;

    // --- RenderTotal Row ---
    // Step 1: Check if renderTotal is configured.
    if (Array.isArray(footerOptions?.renderTotal)) {
      const row = { rowIndex: footer.length, cells: [] as TableCellModel[] };
      const footerColumns = this._totalColumns as number - (this._isRowTotalRendered ? 1 : 0);

      // Step 1a: Fill the row with empty placeholders.
      for (let i = 0; i < footerColumns; i++) {
        row.cells.push(tcell("placeholder").value("").create());
      }

      footerOptions.renderTotal.forEach((title) => {
        const colIdx = __findColIndexByHeader(this.data.header, title);
        if (colIdx !== -1) {
          row.cells[(autoNumbering ? 1 : 0) + colIdx] = tcell(`render-total-${title}`)
            .value(`${title.toUpperCase()}_PLACEHOLDER`)
            .create();
        }
      });

      if (editable) {
        // Step 1b: If editable, place an add button placeholder in the last column.
        // 👇 put the button placeholder always in the last obj in a row.cells
        row.cells[footerColumns - 1] = tcell("add-button").value("ADD_BTN_PLACEHOLDER").create();
        addButtonPlaced = true;
      }

      footer.push(row);
    }

    // --- Data.footer Row ---
    // Step 2: Check if custom footer content is provided.
    if (footerInput) {
      // console.log("_createFooterDomModel > footerInput:", footerInput);
      const row = { rowIndex: footer.length, cells: [] as TableCellModel[] };
      // Step 2a: If footerInput is an array, fill cells directly; otherwise, create a single cell.
      // fill with placeholders first
      if (Array.isArray(footerInput) && footerInput.length > 0) {
        for (let i = 0; i < this._totalColumns!; i++) {
          row.cells.push(tcell(`data-footer-${i}`).value(footerInput[i]).create());
        }
      } else if (footerInput instanceof HTMLElement || typeof footerInput === "string") {
        row.cells[0] = tcell("data-footer").value(footerInput).valign("middle").colspan(this._totalColumns).create();
      }

      footer.push(row);
    }

    // --- Pagination Row ---
    // Step 3: Check if pagination is enabled.
    if (pageSize) {
      const row = { rowIndex: footer.length, cells: [] as TableCellModel[] };
      if (editable) {
        row.cells.push(
          // Step 3a: If editable, create a pagination placeholder spanning all but the last column.
          tcell("pagination")
            .value("PAGINATION_PLACEHOLDER")
            .colspan(this._totalColumns! - 1)
            .create()
        );

        if (!addButtonPlaced) {
          // Step 3b: If add button not yet placed, add it.
          row.cells.push(tcell("add-button").value("ADD_BTN_PLACEHOLDER").create());
          addButtonPlaced = true;
        } else {
          // Step 3c: Otherwise, add an empty placeholder to maintain column count.
          row.cells.push(tcell("placeholder").value("").create());
        }
      } else {
        row.cells.push(tcell("pagination").value("PAGINATION_PLACEHOLDER").colspan(this._totalColumns).create());
      }
      footer.push(row);
    }

    // Step 4: Return the constructed footer rows.
    return footer;
  }

  /**
   * @private
   * @method _insertMetadataRowUids
   *
   * @description
   * Ensure every parent row (array) and subrow (object) has a stable metadata _uid,
   * and convert legacy numeric subrowOf -> subrowOfUid (stable). This
   * makes subrow lookups immune to index shifts.
   */
  _insertMetadataRowUids() {
    for (let i = 0; i < this.data.body.length; i++) {
      const row = this.data.body[i];

      // Parent is an Array (normal row)
      if (Array.isArray(row)) {
        // if (!row._uid) row._uid = this._generateRowUID();
        continue;
      }

      // Subrow is an object { subrowOf: <index | uid>, data: [...] }
      // give subrow itself a uid (useful to track editing)
      if (!row._uid) row._uid = this._generateRowUID();
      if (row && typeof row === "object") {
        // console.log("_insertMetadataRowUids > row:", row);
        // If legacy numeric `subrowOf` exists, convert to `subrowOfUid`
        if (row.subrowOf != null && row.subrowOfUid == null) {
          const parentIndex = Number(row.subrowOf);
          const parent = this.data.body[parentIndex];
          if (parent) {
            // parent may be an Array (normal parent) or object — ensure it has _uid
            if (!parent._uid) parent._uid = this._generateRowUID();
            row.subrowOfUid = parent._uid;
          } else {
            // fallback: treat as uid string if not found
            row.subrowOfUid = String(row.subrowOf);
          }
        }

        // If user already passed subrowOfUid directly, keep it.
      }
    }
  }

  // ---------------------- Core pipeline: normalize -> DOMModel ----------------------

  /**
   * @private
   * @method _processData
   *
   * @description
   * Processes the raw table data and configuration to construct a comprehensive DOM model.
   * This method orchestrates the creation of header, body, and footer DOM models,
   * and then applies various insertions (auto-numbering, action buttons, row totals,
   * footer render totals, and pagination) based on the table's configuration.
   *
   * @returns {DOMModel} The fully processed DOM model object, ready for rendering.
   *
   * @example
   *
   * // Assuming `this.data` and `this.config` are already set up.
   * const domModel = this._processData();
   * // domModel will contain structured representations of the header, body, and footer,
   * // with all configured features (e.g., auto-numbering, editable columns) integrated.
   *
   *
   * @summary
   * 1. **Initialize Flags and Column Count**:
   *    - Ensures all rows have stable UIDs using `_ensureRowUids()`.
   *    - Detects if sub-rows exist to set `_isRowTotalRendered`.
   *    - Calculates the total number of rendered columns using `_countRenderedColumns()`.
   * 2. **Build Base DOM Models**:
   *    - Calls `_createHeaderDomModel()` to build the initial header structure.
   *    - Calls `_createBodyDomModel()` to build the initial body structure, applying pagination and cell processing.
   *    - Calls `_createFooterDomModel()` to build the initial footer structure, including placeholders.
   * 3. **Apply Conditional Insertions**:
   *    - **Auto-numbering**: If `config.autoNumbering` is true, calls `_applyInsertionAutoNumbering()`.
   *    - **Action Buttons**: If `config.editable` is true, calls `_applyInsertionActionButtons()`.
   *    - **Footer Render Totals**: If `config.footerOptions.renderTotal` is configured, calls `_applyInsertionFooterRenderTotal()`.
   *    - **Row Totals**: If sub-rows exist (`hasSubRow` is true), calls `_applyInsertionRowTotalColumns()`.
   *    - **Pagination**: If `config.pageSize` is configured, calls `_applyInsertionPagination()`.
   * 4. **Return Final Model**: Returns the `domModel` object after all processing and insertions are complete.
   */
  _processData(): DOMModel {
    const hasSubRow = this.data.body.some((r) => r && r.subrowOfUid != null);
    this._isRowTotalRendered = hasSubRow ? true : false;
    // total columns to render
    this._totalColumns = this._countRenderedColumns();

    const headerInput = this.data.header || [];
    const bodyInput = this.data.body || [];
    const footerInput = this.data.footer;

    this._insertMetadataRowUids();
    // Step 1: Build the header DOM model.
    const headerModel = this._createHeaderDomModel(headerInput, this.config);
    // Step 2: Build the body DOM model, applying pagination and initial cell processing.
    const bodyModel = this._createBodyDomModel(bodyInput, this.config);
    // Step 3: Build the footer DOM model, including placeholders for dynamic content.
    const footerModel = this._createFooterDomModel(footerInput, this.config);

    let domModel = { header: headerModel, body: bodyModel, footer: footerModel } as DOMModel;

    // Step 4: Apply auto-numbering column insertion if configured.
    if (this.config.autoNumbering) {
      this._applyInsertionAutoNumbering(domModel);
    }

    // Step 5: Apply action buttons column insertion if configured.
    if (this.config.editable) {
      this._applyInsertionActionButtons(domModel);
    }

    // Step 6: Apply footer render total insertion if configured.
    if (this.config.footerOptions?.renderTotal) {
      this._applyInsertionFooterRenderTotal(domModel, this.config);
    }

    // Step 7: Apply row-total column insertion if sub-rows exist in the data.
    if (hasSubRow) {
      this._applyInsertionRowTotalColumns(domModel);
    }

    // Step 8: Apply pagination controls insertion if configured.
    if (this.config.pageSize) {
      this._applyInsertionPagination(domModel);
    }

    // console.log({ header: domModel.header, body: domModel.body, footer: domModel.footer });
    // Step 9: Return the final, processed DOM model.
    return domModel;
  }

  // ---------------------- Renderers ----------------------

  /** @private
   * @method _renderHeader
   *
   * @description
   * Renders the table header (<thead>) element based on the provided `headerRows` DOM model.
   * It handles both single-row and grouped headers, applying cell options and content.
   *
   * @param {TableRowModel[]} headerRows - An array of arrays, where each inner array represents a header row
   *   and contains `HeaderCell` objects.
   * @returns {HTMLTableSectionElement} The constructed <thead> HTML element.
   *
   * @example
   *
   * // Assuming `domModel.header` is structured as:
   * // [
   * //   [{ key: "col0", value: "Name", options: {} }],
   * //   [{ key: "col1", value: "Age", options: {} }]
   * // ]
   * const theadElement = this._renderHeader(domModel.header);
   * // theadElement will be a <thead> with two <tr>s, each containing a <th>.
   *
   * // Example with grouped header (two rows):
   * // [
   * //   [{ key: "group-Info", value: "Info", options: { colspan: 2 } }],
   * //   [{ key: "col0", value: "Name", options: {} }, { key: "col1", value: "Age", options: {} }]
   * // ]
   * // The first <th> in the first <tr> will have colspan=2, and the second <tr> will have two <th>s.
   *
   *
   * @summary
   * 1. **Create <thead>**: Initializes a new `<thead>` element.
   * 2. **Initialize Sorting State**: Sets an initial `isAscending` flag for sortable columns.
   * 3. **Iterate Header Rows**: Loops through each `row` in the `headerRows` array.
   * 4. **Create `<tr>`**: For each header row, creates a new `<tr>` element.
   * 5. **Iterate Cells**: Loops through each `cell` within the current header `row`.
   * 6. **Create `<th>`**: Creates a new `<th>` element for each cell.
   * 7. **Bind Sort Listener (if sortable)**: If `config.sortable` is true, attaches a click listener to the `<th>`
   *    to handle sorting, re-rendering the table, and toggling `isAscending`.
   * 8. **Set Cell Content**: Determines the content of the `<th>`. If `cell.value` is an `HTMLElement`, it appends it;
   *    otherwise, it sets `textContent` from `cell.value`.
   * 9. **Apply Cell Options**: Calls `__applyCellOptions` to apply styling and attributes (like `rowspan`, `colspan`)
   *    from `cell.options` to the `<th>`.
   * 10. **Append to DOM**: Appends the `<th>` to the `tr`, and the `<tr>` to the `<thead>`.
   * 11. **Return `<thead>`**: Returns the fully constructed `<thead>` element.
   */
  _renderHeader(headerRows: TableRowModel[]): HTMLTableSectionElement {
    // Step 1: Initialize a new <thead> element.
    const thead = this.table.createTHead();
    // Step 2: Initialize a flag for sorting direction.
    // let isAscending: boolean = true;
    // Step 3: Iterate through each header row model.
    for (const [index, row] of Object.entries(headerRows)) {
      // Step 4: Create a new <tr> element for the current header row.
      const tr = thead.insertRow(Number(index));
      // Step 5: Iterate through each cell within the current header row.
      for (let ci = 0; ci < row.cells.length; ci++) {
        const cell = row.cells[ci];
        // Step 6: Create a new <th> element for the current cell.
        const th = document.createElement("th");
        // Step 7: If sorting is enabled, bind a sort listener to the <th>.
        if (this.config.sortable) {
          __bindSortListener(th, ci, (_colIndex: number, _state: boolean) => {
            // isAscending = state;
            this.render();
          });
        }
        // cell.value can be string or HTMLElement
        if (cell && typeof cell === "object" && !(cell.value instanceof HTMLElement) && cell.value.hasOwnProperty("text")) {
          th.textContent = String(cell.value);
        } else if (cell.value instanceof HTMLElement) {
          th.appendChild(cell.value);
        } else {
          // Step 8: Set the text content of the <th>.
          th.textContent = String(cell.value ?? "");
        }

        // Step 9: Apply any specified cell options (e.g., rowspan, colspan, styling) to the <th>.
        if (cell.options) {
          __applyCellOptions(th, cell.options);
        }
        // Step 10: Append the <th> to the current <tr>.
        tr.appendChild(th);
      }
    }
    return thead;
  }

  /**
   * @private
   * @method _renderBody
   *
   * @description
   * Renders the table body (<tbody>) element based on the provided `bodyModel` DOM model.
   * It iterates through each row model, creates `tr` and `td` elements,
   * applies formatting, and attaches necessary metadata for editing.
   *
   * @param {TableRowModel[]} bodyModel - An array of `BodyRowModel` objects, representing the rows
   *   and their cells to be rendered in the table body.
   * @returns {HTMLTableSectionElement} The constructed <tbody> HTML element.
   *
   * @example
   *
   * // Assuming `domModel.body` is structured as:
   * // [
   * //   { rowIndex: 0, uid: "row_1", cells: [{ key: "col0", value: "Alice" }, { key: "col1", value: 24 }] },
   * //   { rowIndex: 1, uid: "row_2", parentUid: "row_1", cells: [{ key: "col0", value: "Bob" }, { key: "col1", value: 30 }] }
   * // ]
   * const tbodyElement = this._renderBody(domModel.body);
   * // tbodyElement will be a <tbody> with two <tr>s, each containing <td>s with data.
   * // The second <tr> will have the 'sub-row' class.
   *
   *
   * @summary
   * 1. **Create <tbody>**: Initializes a new <tbody> element.
   * 2. **Get Formula Index**: Determines the `formulaIndex` from `config.bodyOptions` to identify
   *    columns that might have special handling (e.g., for row totals).
   * 3. **Iterate Body Rows**: Loops through each `rowModel` in the `bodyModel` array.
   * 4. **Create `tr`**: For each `rowModel`, creates a new `tr` element.
   * 5. **Set `data-` Attributes**: Sets `data-global-index` and `data-uid` on the `tr` for identification.
   * 6. **Detect Sub-row**: Checks if the current row is a sub-row based on `rawRow.subrowOfUid` and
   *    adds the `sub-row` class to the `tr` if it is.
   * 7. **Iterate Cells**: Loops through each `cell` within the current `rowModel.cells` array.
   * 8. **Create `td`**: Creates a new `td` element for each cell.
   * 9. **Set Cell Content**:
   *    - If `cell.value` is an `HTMLElement`, it appends the element directly to the `td`.
   *    - Otherwise, it formats the `cell.value` using `__formatValue` (which can return an `HTMLElement` or a string).
   *      If an `HTMLElement`, it's appended; otherwise, `innerHTML` is set within a `div.cell` wrapper.
   * 10. **Apply Cell Options**: Calls `__applyCellOptions` to apply styling and attributes from `cell.options` to the `td`.
   * 11. **Attach Metadata**: Sets `data-col-index` (adjusting for `autoNumbering`), `data-format`,
   *     `_originalRawValue`, and `_cellOptions` on the `td` for later use in editing.
   * 12. **Append to DOM**: Appends the `td` to the `tr`, and the `tr` to the <tbody>.
   * 13. **Return <tbody>**: Returns the fully constructed <tbody> element.
   */
  _renderBody(bodyModel: TableRowModel[]): HTMLTableSectionElement {
    // Step 1: Create a new <tbody> element.
    const tbody = this.table.createTBody();
    // Step 2: Iterate through each row model in the bodyModel.
    for (const [index, rowModel] of Object.entries(bodyModel)) {
      // Step 3: Create a new <tr> element for the current row.
      const tr = tbody.insertRow(Number(index));
      // Step 4: Set data attributes for global index and UID.
      // console.log(rowModel.rowIndex === tr.sectionRowIndex, rowModel.rowIndex, tr.sectionRowIndex);
      tr.dataset.globalIndex = String(rowModel.rowIndex);
      if (rowModel.uid) tr.dataset.uid = rowModel.uid;

      // Step 5: Detect if the underlying data row is a sub-row and add the 'sub-row' class if it is.
      const rawRow = this.data.body[rowModel.rowIndex as number];
      const isSubRow = rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null;
      if (isSubRow) tr.classList.add("sub-row");

      // Step 6: Render each cell in the current rowModel.
      for (let ci = 0; ci < rowModel.cells.length; ci++) {
        const cell = rowModel.cells[ci];
        // Step 7: Create a new <td> element for the current cell.
        const td = tr.insertCell(ci);

        // Step 8: Insert content into the <td>.
        if (cell.value instanceof HTMLElement) {
          // If cell.value is an HTMLElement, append it directly.
          td.appendChild(cell.value);
        } else {
          // Otherwise, format the value and insert it, wrapped in a <div>.
          const formattedValue = __formatValue(cell.value, cell.options || {});
          if (formattedValue instanceof HTMLElement) td.appendChild(formattedValue);
          else td.innerHTML = `<div class="cell">${formattedValue ?? ""}</div>`;
        }

        // Step 9: Apply any specified cell options to the <td>.
        if (cell.options) {
          __applyCellOptions(td, cell.options);
        }

        // Step 10: Attach metadata to the <td> for editing and parsing.
        td.dataset.colIndex = String(ci - (this.config.autoNumbering ? 1 : 0)); // relative index to data columns
        // console.log("cell index", String(ci - (this.config.autoNumbering ? 1 : 0)), td.cellIndex - 1);
        td.dataset.format = (cell.options && cell.options.format) || typeof cell.value;

        // keep original raw value for editing and formatting
        td.dataset.originalValue = cell.value.toString();
        td.dataset.cellOptions = JSON.stringify(cell.options || {});
      }
    }
    return tbody;
  }

  /**
   * @private
   * @method _renderFooter
   *
   * @description
   * Render footer rows element
   * @param {TableRowModel[]} footerRows - An array of `TableRowModel` objects representing the footer rows.
   * @returns {HTMLTableSectionElement|null} The constructed <tfoot> HTML element, or `null` if `footerRows` is falsy.
   *
   * @example
   *
   * // Assuming `domModel.footer` is structured as:
   * // [
   * //   { cells: [{ key: "total", value: "Grand Total: $100", options: { colspan: 3 } }] }
   * // ]
   * const tfootElement = this._renderFooter(domModel.footer);
   * // tfootElement will be a <tfoot> with one <tr> containing a <th> with the total text.
   *
   *
   * @summary
   * 1. **Check for Footer Rows**: If `footerRows` is falsy (e.g., `null` or empty array), returns `null`.
   * 2. **Create <tfoot>**: Initializes a new <tfoot> element.
   * 3. **Iterate Footer Rows**: Loops through each `row` in the `footerRows` array.
   * 4. **Create `tr`**: For each footer row, creates a new `tr` element.
   * 5. **Apply Row Options**: If `row.options.class` or `row.options.id` are present, applies them to the `tr`.
   * 6. **Iterate Cells**: Loops through each `cell` within the current footer `row`.
   * 7. **Create `th`**: Creates a new `th` element for each cell.
   * 8. **Apply Cell Options**: Calls `__applyCellOptions` to apply styling and attributes (like `colspan`) from `cell.options` to the `th`.
   * 9. **Insert Content**: Determines the content of the `th`. If `cell.value` is an `HTMLElement`, it appends it; otherwise, it sets `innerHTML`.
   * 10. **Append to DOM**: Appends the `th` to the `tr`, and the `tr` to the <tfoot>.
   * 11. **Return <tfoot>**: Returns the fully constructed <tfoot> element.
   */
  _renderFooter(footerRows: TableRowModel[] | null): HTMLTableSectionElement | null {
    // Step 1: If no footer rows are provided, return null.
    if (!footerRows) return null;

    // Step 2: Create a new <tfoot> element.
    const tfoot = this.table.createTFoot();

    // Step 3: Iterate through each footer row model.
    footerRows.forEach((row, index) => {
      // Step 4: Create a new <tr> element for the current footer row.
      const tr = tfoot.insertRow(index);
      // Step 5: Apply any class or ID options to the <tr>.
      if (row.options?.class) tr.className = row.options.class;
      if (row.options?.id) tr.id = row.options.id;

      // Step 6: Iterate through each cell within the current footer row.
      row.cells.forEach((cell) => {
        // Step 7: Create a new <th> element for the current cell.
        const th = document.createElement("th");

        // Step 8: Apply any specified cell options to the <th>.
        if (cell.options) {
          __applyCellOptions(th, cell.options);
        }

        // Step 9: Insert content into the <th>.
        if (cell.value instanceof HTMLElement) {
          th.appendChild(cell.value);
        } else if (cell.value != null) {
          th.innerHTML = String(cell.value);
        } else {
          th.innerHTML = ""; // empty cell
        }
        // Step 10: Append the <th> to the current <tr>.
        tr.appendChild(th);
      });
    });

    return tfoot;
  }

  /**
   * @private
   * @method _createGrandTotalColumn
   *
   * @description
   * Creates the HTML content for a grand total column, optionally including a page total.
   * This content is typically used within a footer cell.
   *
   * @param {Object} headerTitle - The header object for the column, containing `colIndex`.
   * @param {TableConfig} config - The table configuration object.
   * @returns {string} An HTML string representing the grand total and optionally page total.
   *
   * @examples
   *
   * // Assuming a column at index 2 (after autoNumbering) with numeric data
   * const totalHtml = this._createGrandTotalColumn({ colIndex: 2 }, this.config);
   * // totalHtml might look like:
   * // `<div class="cell page"><div class="title">PAGE 1 TOTAL</div>1,234.56</div>
   * //  <div class="cell grand"><div class="title">GRAND TOTAL</div>5,678.90</div>`
   *
   *
   * @summary
   * 1. **Determine Column Index**: Adjusts the `colIndex` from the `header` object based on whether `autoNumbering` is enabled.
   * 2. **Calculate Grand Total**:
   *    - Applies formulas to the entire `this.data.body` using `__applyFormula`.
   *    - Extracts all values for the target column.
   *    - Filters for numeric values and calculates their sum.
   *    - Formats the sum using `__formatValue` based on `config.bodyOptions` for that column.
   *    - Constructs an HTML string for the "GRAND TOTAL".
   * 3. **Calculate Page Total (if `pageSize` is enabled)**:
   *    - Extracts values for the target column from `this.pageRows` (which contains only current page data).
   *    - Filters for numeric values and calculates their sum.
   *    - Formats the sum using `__formatValue`.
   *    - Constructs an HTML string for the "PAGE {currentPage} TOTAL".
   *    - Prepends the page total HTML to the grand total HTML.
   * 4. **Return HTML**: Returns the combined HTML string.
   */
  _createGrandTotalColumn(headerTitle: { title: string; colIndex: number }, config: TableConfig): string {
    const colIndex = headerTitle.colIndex - (config.autoNumbering ? 1 : 0);
    const sum = this.data.body
      .map((r) => {
        const formula = config.bodyOptions?.[colIndex]?.formula as string;
        if (formula) {
          return __calculateRow(this.data.header, __getRowData(r), colIndex, formula);
        } else {
          return __getRowData(r)[colIndex];
        }
      })
      .filter((v) => typeof v === "number")
      .reduce((a, b) => a + b, 0);

    let total = `
      <div class="cell page">
        <div class="title">GRAND TOTAL</div>
        ${__formatValue(sum, config.bodyOptions?.[colIndex] || {})}
      </div>`;

    if (config.pageSize) {
      const pageVals = this.pageRows
        .map((r) => {
          if (r[colIndex]?.hasOwnProperty("text")) {
            return r[colIndex].text;
          } else {
            return r[colIndex];
          }
        })
        .filter((v) => typeof v === "number");

      const pageSum = pageVals.reduce((a, b) => a + b, 0);
      const pageTotal = `
        <div class="cell grand">
          <div class="title">PAGE ${this.currentPage} TOTAL</div>
          ${__formatValue(pageSum, config.bodyOptions?.[colIndex] || {})}
        </div>`;
      total = pageTotal + total;
    }

    return total;
  }

  /**
   * @private
   * @method _createAddRowButton
   *
   * @description
   * Creates an HTML button element for adding a new row to the table.
   * This button is typically placed in the table footer.
   *
   * @returns {HTMLButtonElement} The constructed "Add Row" button element.
   *
   * @example
   *
   * const addButton = this._createAddRowButton();
   * // addButton is a <button> with a plus icon and "Add Row" text.
   * // Clicking it will call `this.addRow()`.
   *
   *
   * @summary
   * 1. **Create Button**: Initializes a new `HTMLButtonElement`.
   * 2. **Set Attributes**: Sets `type="button"`, `className` for Semantic UI styling (`ui positive basic button add-btn`).
   * 3. **Set Inner HTML**: Adds a `<i class="icon plus icon"></i>` for visual representation and the text "Add Row".
   * 4. **Apply Size Class**: If the table `config.size` is "small" or "very compact", it adds the "mini" class to the button.
   * 5. **Attach Event Listener**: Adds a `click` event listener that calls `this.addRow()` when the button is clicked.
   * 6. **Return Button**: Returns the fully configured button element.
   */
  _createAddRowButton(): HTMLButtonElement {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-row-btn";
    addBtn.innerHTML = `<i class="icon plus"></i><span style="margin-left:0.3em;">Add Row</span>`;
    if (["small", "very compact"].includes(this.config.size!)) addBtn.classList.add("mini");
    addBtn.addEventListener("click", () => this.addRow());
    return addBtn;
  }

  /**
   * @private
   * @method _createActionButtons
   *
   * @description
   * Creates a container `div` with action buttons (Edit, Remove, and optionally Add Sub-row)
   * for a table row. These buttons are used within the editable column of each row.
   *
   * @param {boolean} [isSubRow=false] - A flag indicating whether the buttons are for a sub-row.
   *   If `true`, the "Add Sub-row" button will not be included.
   * @returns {HTMLDivElement} The constructed `div` element containing the action buttons.
   *
   * @example
   *
   * // For a parent row:
   * const actionButtonsParent = this._createActionButtons(false);
   * // actionButtonsParent will contain Edit, Remove, and Add Sub-row buttons.
   *
   * // For a sub-row:
   * const actionButtonsSubRow = this._createActionButtons(true);
   * // actionButtonsSubRow will contain Edit and Remove buttons only.
   *
   *
   * @summary
   * 1. **Create Container**: Initializes a `div` element with the class "actions".
   * 2. **Create Edit Button**:
   *    - Initializes an "Edit" button with a primary edit icon.
   *    - Attaches a `click` event listener:
   *      - Toggles the "editing" class on the parent `tr`.
   *      - Toggles the "active" class on the edit button.
   *      - Calls `this._setRowEditableState` to enable/disable contenteditable cells.
   *      - If entering edit mode, focuses the first editable cell.
   * 3. **Append Edit Button**: Adds the "Edit" button to the container.
   * 4. **Create Remove Button**:
   *    - Initializes a "Remove" button with a red times icon.
   *    - Attaches a `click` event listener:
   *      - Gets the `globalIndex` of the row.
   *      - If `isSubRow` is `true`, it removes the sub-row from `this.data.body` and re-renders.
   *      - Otherwise, it calls `this.removeRow()` for a parent row.
   * 5. **Create Add Sub-row Button (Conditional)**:
   *    - If `isSubRow` is `false` (i.e., it's a parent row), an "Add Sub-row" button with a green plus icon is created.
   *    - Attaches a `click` event listener that calls `this.insertSubRow()` for the current row.
   *    - Appends this button to the container.
   * 6. **Append Remove Button**: Adds the "Remove" button to the container.
   * 7. **Apply Size Tweak**: If `config.size` is "small" or "very compact", it adds the "mini" class to all buttons within the container.
   * 8. **Return Container**: Returns the fully configured `div` containing the action buttons.
   */
  _createActionButtons(isSubRow: boolean = false): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "actions-set";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.innerHTML = `<i class="icon edit"></i>`;
    editBtn.setAttribute("aria-label", "Edit row");
    editBtn.addEventListener("click", () => {
      const tr = container.closest("tr") as HTMLTableRowElement;
      const editing = tr.classList.toggle("editing");
      editBtn.classList.toggle("active", editing);
      this._setRowEditableState(tr, editing);
      if (editing) {
        const firstCell = tr.cells.item(0);
        if (firstCell instanceof HTMLElement) firstCell.focus();
      }
    });

    container.appendChild(editBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = `<i class="icon trash"></i>`;
    removeBtn.setAttribute("aria-label", "Remove row");
    removeBtn.addEventListener("click", () => {
      const tr = container.closest("tr") as HTMLTableRowElement;
      const gIdx = Number(tr.dataset.globalIndex ?? tr.sectionRowIndex);
      if (isSubRow) {
        this.data.body.splice(gIdx, 1);
        this.render();
        this._emitChange({ type: "remove-subrow", rowIndex: gIdx });
      } else {
        this.removeRow(gIdx);
      }
    });

    if (!isSubRow) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "add-btn";
      addBtn.innerHTML = `<i class="icon plus"></i>`;
      addBtn.setAttribute("aria-label", "Add sub-row");
      addBtn.addEventListener("click", () => {
        const tr = container.closest("tr") as HTMLTableRowElement;
        const gIdx = Number(tr.dataset.globalIndex ?? tr.sectionRowIndex);
        this.insertSubRow([], gIdx);
      });
      container.appendChild(addBtn);
    }

    container.appendChild(removeBtn);

    if (["small", "very compact"].includes(this.config.size!)) {
      container.querySelectorAll("button").forEach((b) => b.classList.add("mini"));
    }

    return container;
  }

  /**
   * @private
   * @method _createPaginationControls
   *
   * @description
   * Creates an HTML `div` element containing pagination controls (Previous, page numbers, Next).
   * This menu allows users to navigate between different pages of the table data.
   *
   * @returns {HTMLDivElement} The constructed pagination menu element.
   *
   * @example
   *
   * const paginationMenu = this._createPaginationControls();
   * // paginationMenu is a <div> with "ui pagination menu" classes,
   * // containing anchor tags for navigation.
   *
   *
   * @summary
   * 1. **Create Menu Container**: Initializes a `div` element with Semantic UI pagination menu classes.
   * 2. **Apply Size Class**: If the table `config.size` is "small" or "very compact", it adds the "mini" class to the menu.
   * 3. **Calculate Total Pages**: Determines the total number of pages based on `this.data.body.length` and `this.config.pageSize`.
   * 4. **Create "Previous" Button**:
   *    - Initializes an anchor (`a`) element with an icon.
   *    - Attaches a `click` event listener that calls `this.switchPage(this.currentPage - 1)`.
   *    - Disables the button (`pointerEvents = "none"`) if `currentPage` is 1.
   *    - Appends to the menu.
   * 5. **Create Page Number Buttons**:
   *    - Loops from 1 to `totalPages`.
   *    - For each page number, creates an anchor (`a`) element.
   *    - Adds the "active" class if it's the `currentPage`.
   *    - Sets `textContent` to the page number.
   *    - Attaches a `click` event listener that calls `this.switchPage(i)`.
   *    - Appends to the menu.
   * 6. **Create "Next" Button**:
   *    - Initializes an anchor (`a`) element with an icon.
   *    - Attaches a `click` event listener that calls `this.switchPage(this.currentPage + 1)`.
   *    - Disables the button if `currentPage` is the last page.
   *    - Appends to the menu.
   * 7. **Return Menu**: Returns the fully configured pagination menu element.
   */
  _createPaginationControls(): HTMLDivElement {
    const menu = document.createElement("div");
    menu.className = "pagination menu";
    if (this.config.size === "small" || this.config.size === "very compact") menu.classList.add("mini");

    const totalPages = Math.max(1, Math.ceil(this.data.body.length / this.config.pageSize!));

    const prev = document.createElement("a");
    prev.className = "item previous";
    prev.innerHTML = `<i class="icon arrow left"></i>`;
    prev.addEventListener("click", () => this.switchPage(this.currentPage - 1));
    prev.style.pointerEvents = this.currentPage <= 1 ? "none" : "";
    menu.appendChild(prev);

    // simple pages (1..N) — you can later swap for smart truncation
    for (let i = 1; i <= totalPages; i++) {
      const item = document.createElement("a");
      item.className = `item${i === this.currentPage ? " active" : ""}`;
      item.textContent = String(i);
      item.addEventListener("click", () => this.switchPage(i));
      menu.appendChild(item);
    }

    const next = document.createElement("a");
    next.className = "item next";
    next.innerHTML = `<i class="icon arrow right"></i>`;
    next.addEventListener("click", () => this.switchPage(this.currentPage + 1));
    next.style.pointerEvents = this.currentPage >= totalPages ? "none" : "";
    menu.appendChild(next);

    return menu;
  }

  // ---------------------- Editing helpers (simplified) ----------------------

  /**
   * @private
   * @method _setRowEditableState
   *
   * @description
   * Toggles the editable state of a table row. When a row becomes editable, its data cells
   * (excluding action, row-total, and formula columns) are made contenteditable, allowing
   * the user to modify their values. When editing is finished, changes are committed
   * to the underlying data model, and the table is re-rendered.
   *
   * @param {HTMLTableRowElement} tr - The `tr` element representing the row to be edited.
   * @param {boolean} editable - `true` to enable editing, `false` to disable.
   * @returns {void}
   *
   * @example
   *
   * // Assuming 'tr' is a table row element and 'editButton' is the edit button
   * // To enable editing:
   * this._setRowEditableState(tr, true, editButton);
   *
   * // To disable editing and commit changes:
   * this._setRowEditableState(tr, false, editButton);
   *
   *
   * @summary
   * 1. **Identify Formula Column**: Determines the index of any column configured with a formula,
   *    as these columns are typically not directly editable.
   * 2. **Get Row Metadata**: Extracts the global index (`g`) and UID (`uid`) from the `tr` element.
   * 3. **Iterate Cells**: Loops through all `td` elements within the `tr`.
   * 4. **Skip Non-Editable Cells**: Skips cells that are action buttons, row totals, or formula columns.
   * 5. **Enable Editing (if `editable` is true)**:
   *    - Retrieves the original raw value of the cell.
   *    - Sets the cell's `innerHTML` to the raw value (wrapped in a `div.cell`).
   *    - Sets `contenteditable="true"` and `spellcheck="false"` attributes.
   *    - Focuses the cell.
   * 6. **Disable Editing (if `editable` is false)**:
   *    - Retrieves the edited text content from the cell.
   *    - Parses the edited text into its final value using `__parseValue` based on the cell's format.
   *    - Updates the corresponding value in `this.data.body` (handling both array and sub-row object structures).
   *    - Stores the `finalVal` as `_originalRawValue` for future edits.
   *    - Reformats the display value using `__formatValue`.
   *    - Removes `contenteditable` and `spellcheck` attributes.
   * 7. **Re-render and Emit Change**: If editing was disabled, the table is re-rendered to reflect
   *    any committed changes, and a "change" event of type "edit" is emitted.
   */
  _setRowEditableState(tr: HTMLTableRowElement, editable: boolean): void {
    // toggles contenteditable on data columns (td[data-col-index])
    // Step 1: Identify the index of any column that has a formula defined in bodyOptions.
    // Cells in this column are typically not directly editable.
    const formulaIndex = (this.config.bodyOptions || []).findIndex((opt) => !!opt?.formula);
    // Step 2: Get the global index of the row from its dataset.
    const g = Number(tr.dataset.globalIndex ?? tr.sectionRowIndex);
    // Step 3: Get the unique identifier of the row from its dataset.
    // const uid = tr.dataset.uid;

    // Step 4: Iterate over all table data cells (<td>) within the current row.
    tr.querySelectorAll("td").forEach((td) => {
      // Step 5: Get the column index of the current cell.
      // const ci = Number(td.dataset.colIndex);
      const ci = td.cellIndex - 1;
      // Disable spellcheck on each cell
      td.spellcheck = false;
      // Step 6: Skip cells that are not meant to be editable:
      // - Action buttons column (has class 'action').
      // - Row total column (has class 'row-total').
      // - Cells without a 'data-col-index' (e.g., auto-numbering column).
      // - Cells with a 'data-col-index' of -1 (which might indicate a special column).
      // - Cells that correspond to a formula column (as their values are computed).
      if (
        td.classList.contains("actions") ||
        td.classList.contains("row-total") ||
        td.dataset.colIndex === undefined ||
        ci === Number(-1) ||
        ci === formulaIndex
      ) {
        return;
      }

      // Step 7: If enabling editing for the row.
      if (editable) {
        // Step 7a: Retrieve the original raw value of the cell. If not available,
        // try to get it from the main data body or default to an empty string.
        const rawVal = td.dataset.originalValue ?? __getRowData(this.data.body[g])?.[ci] ?? "";
        // Step 7b: Set the cell's inner HTML to the raw value, wrapped in a div for consistent styling.
        td.innerHTML = `<div class="cell">${rawVal == null ? "" : String(rawVal)}</div>`;
        // Step 7c: Make the cell contenteditable.
        td.contentEditable = "true";
        // Step 7d: Focus the cell to allow immediate editing.
        td.focus();
      } else {
        // Step 8: If disabling editing for the row (committing changes).
        // Step 8a: Get the edited text content from the cell, trimming whitespace.
        const editedText = td.textContent == null ? "" : td.textContent.trim();
        // Step 8b: Determine the format of the cell (defaulting to 'text').
        const format = td.dataset.format || "text";
        // Step 8c: Parse the edited text into its final typed value based on the format.
        const finalVal = __parseValue(editedText, format);

        // Step 8d: Update the underlying data model with the final value.
        // Handles both simple array rows and sub-row objects.
        const row = this.data.body[g];
        if (Array.isArray(row)) {
          row[ci] = finalVal;
        } else if (row && row.subrowOfUid != null && Array.isArray(row.data)) {
          row.data[ci] = finalVal;
        }
        // Step 8e: Store the final value as the original raw value for subsequent edits.
        td.dataset.originalValue = finalVal;

        // Step 8f: Reformat the display value of the cell and update its inner HTML.
        const display = __formatValue(finalVal, JSON.parse(td.dataset.cellOptions!) || {});
        td.innerHTML = `<div class="cell">${display}</div>`;
        // Step 8g: Disable contentEditable;
        td.contentEditable = "false";
      }
    });

    // Step 9: If editing was disabled, re-render the entire table to update
    // any dependent calculations (like footer totals, row totals) and emit a change event.
    if (!editable) {
      this.render();
      this._emitChange({ type: "edit" });
    }
  }

  /**
   * @private
   * @method _openRowForEditByGlobalIndex
   *
   * @description
   * Opens a specific row for editing by its global index. This involves
   * ensuring the row is visible (by switching pages if necessary) and then
   * programmatically "clicking" its edit button to activate edit mode.
   *
   * @param {number} globalIndex - The global index of the row to open for editing.
   * @returns {void}
   *
   * @example
   *
   * // Open the row at global index 5 for editing
   * tableBuilder._openRowForEditByGlobalIndex(5);
   *
   *
   * @summary
   * 1. **Locate Row**: Attempts to find the `tr` element corresponding to the `globalIndex`
   *    within the current <tbody>.
   * 2. **Handle Pagination**: If the row is not found (implying it's on a different page),
   *    and `pageSize` is configured:
   *    - Calculates the correct page number for the `globalIndex`.
   *    - Sets `this.currentPage` to that page.
   *    - Triggers a `render()` to display the new page.
   * 3. **Activate Edit Mode**: After ensuring the row is rendered and visible:
   *    - Finds the "Edit" button (`.edit-btn`) within the target `tr`.
   *    - Programmatically triggers a `click()` event on the edit button, which in turn
   *      calls `_setRowEditableState` to enable editing for that row.
   *    - Focuses the first editable `td` in the row.
   */
  _openRowForEditByGlobalIndex(globalIndex: number): void {
    // Step 1: Attempt to find the table row (<tr>) corresponding to the globalIndex in the current tbody.
    const tr = this.tbody?.querySelector(`tr[data-global-index="${globalIndex}"]`);
    // Step 2: If the row is not found, it might be on a different page.
    if (!tr) {
      // Step 2a: If pagination is enabled, calculate the correct page for the row.
      if (this.config.pageSize) {
        const page = Math.floor(globalIndex / this.config.pageSize) + 1;
        // Step 2b: Set the current page and re-render the table to display that page.
        this.currentPage = page;
        this.render();
      }
    }
    // Step 3: After rendering (or if the row was already on the current page),
    // find the row again to ensure it's in the DOM.
    const tr2 = this.tbody?.querySelector(`tr[data-global-index="${globalIndex}"]`);
    if (tr2) {
      // Step 4: Find the edit button within the row and simulate a click to activate edit mode.
      const editBtn = tr2.querySelector("button.edit-btn");
      if (editBtn && editBtn instanceof HTMLButtonElement) editBtn.click();
      if (tr2 && tr2 instanceof HTMLTableRowElement) {
        // Step 5: Find the 1st cell and set to focus().
        const firstCell = tr2.cells.item(0);
        if (firstCell && firstCell instanceof HTMLTableCellElement) firstCell.focus();
      }
    }
  }

  // ---------------------- Element Insert by config --------------------------

  /**
   * @private
   * @method _applyInsertionAutoNumbering
   *
   * @description
   * Applies auto-numbering to the DOM model by inserting a new column at the beginning
   * of the header, body, and footer sections.
   *
   * @param {DOMModel} domModel - The DOM model object containing header, body, and footer arrays.
   * @returns {void}
   *
   * @example
   *
   * // Assuming domModel has been initialized and config.autoNumbering is true.
   * this._applyInsertionAutoNumbering(domModel);
   * // The domModel.header, domModel.body, and domModel.footer will now have
   * // an additional cell at the beginning for auto-numbering.
   *
   *
   * @summary
   * 1. **Header**:
   *    - Determines the label for the auto-numbering column (e.g., "#" or custom string).
   *    - Inserts a `tcell` object representing the auto-numbering header into the first header row.
   *    - If there are multiple header rows (grouped headers), this cell spans all header rows.
   * 2. **Body**:
   *    - Initializes a `displayIndex` to keep track of the row numbers, considering pagination offset.
   *    - Iterates through each `rowModel` in `domModel.body`.
   *    - For parent rows (`!isSubRow`):
   *      - Increments `displayIndex`.
   *      - Inserts a `tcell` with the current `displayIndex` (adjusted for page offset) into the row.
   *    - For sub-rows (`isSubRow`):
   *      - Inserts a `tcell` with a placeholder (e.g., "•") to maintain column alignment.
   * 3. **Footer**:
   *    - No direct modification to the footer is performed in this function, as the footer's structure
   *      is expected to be handled by other insertion methods or its initial creation.
   */
  _applyInsertionAutoNumbering(domModel: DOMModel): void {
    const key = "autoNumber";
    // Step 1: Determine the label for the auto-numbering column.
    const label = typeof this.config.autoNumbering === "string" ? this.config.autoNumbering : "#";

    // --- Header ---
    // Step 2: Iterate through header rows to insert the auto-numbering cell.
    domModel.header.forEach((row, rowIndex) => {
      // Step 2a: For the first header row, insert the auto-numbering cell.
      // This cell will span all header rows if there are multiple.
      if (rowIndex === 0) {
        row.cells.unshift(
          tcell(key)
            .value(label)
            .rowspan(domModel.header.length) // rowSpan size is the header rows length itself
            .align("center")
            .options(this.config.headerOptions)
            .create()
        );
      }
    });

    // --- Body ---
    domModel.body.forEach((row, _idx) => {
      // numbering only for main rows (subrows covered by rowspan)
      const isSubRow = !!row.parentUid;
      if (!isSubRow) {
        row.cells.unshift(
          tcell(key)
            .value(row[key]) // use metaUid build in bodyDomModel as number
            .class(key) // Add class for styling
            .align("center")
            .create()
        );
      } else {
        // subrows get placeholder (so column count matches)
        row.cells.unshift(tcell(key).value("•").align("right").create());
      }
    });

    // --- Footer ---
    // Step 3: No direct modification to the footer is needed here, as its structure
    // is handled by other insertion methods or its initial creation.
  }

  /**
   * @private
   * @method _applyInsertionActionButtons
   *
   * @description
   * Inserts action buttons into the DOM model for editable rows. This includes
   * adding an "Actions" header, action buttons for each body row, and an "Add Row" button
   * in the footer.
   *
   * @param {DOMModel} domModel - The DOM model object containing header, body, and footer arrays.
   * @returns {void}
   *
   * @example
   *
   * // Assuming domModel has been initialized and config.editable is true.
   * this._applyInsertionActionButtons(domModel);
   * // The domModel.header will have an "Actions" column.
   * // Each domModel.body row will have an action button cell.
   * // The domModel.footer will have an "Add Row" button.
   *
   *
   * @summary
   * 1. **Header**:
   *    - Determines the label for the "Actions" header (e.g., "Actions" or custom string).
   *    - If no header rows exist, it creates a single header row with the "Actions" cell.
   *    - If a single header row exists, it appends the "Actions" cell to it.
   *    - If grouped headers (two rows) exist, it inserts the "Actions" cell into the top row,
   *      spanning both rows.
   * 2. **Body**:
   *    - Iterates through each `rowModel` in `domModel.body`.
   *    - For each row, it determines if it's a sub-row.
   *    - It then creates an action button container using `this._createActionButtons()`
   *      (which generates Edit, Remove, and optionally Add Sub-row buttons).
   *    - This button container is wrapped in a `tcell` and appended to the `rowModel.cells`.
   * 3. **Footer**:
   *    - Iterates through each row in `domModel.footer`.
   *    - It looks for a placeholder cell with the key "add-button".
   *    - If found, it replaces this placeholder with an actual "Add Row" button created by
   *      `this._createAddRowButton()`.
   */
  _applyInsertionActionButtons(domModel: DOMModel): void {
    // Step 1: Get configuration and determine the label for the "Actions" column.
    const cfg = this.config;
    const label = typeof cfg.editable === "string" ? cfg.editable : "Actions";

    // ---------- HEADER ----------
    // Step 2: Handle header insertion based on the number of header rows.
    const key = label.toLowerCase();
    const headerRows = domModel.header || [];
    if (headerRows.length === 0) {
      // Step 2a: If no header rows exist, create a single header row with the "Actions" cell.
      domModel.header = [
        {
          rowIndex: 0,
          cells: [tcell(key).value(label).align("center").options(cfg.headerOptions).create()],
        },
      ];
    } else if (headerRows.length === 1) {
      // Step 2b: If a single header row exists, append the "Actions" cell to it.
      headerRows[0].cells.push(tcell(key).value(label).align("center").options(cfg.headerOptions).create());
    } else {
      // Step 2c: If grouped headers exist, insert the "Actions" cell into the top row, spanning both.
      headerRows[0].cells.push(tcell(key).value(label).rowspan(2).align("center").options(cfg.headerOptions).create());
      // bottom row needs no action cell because top spans both rows
    }

    // ---------- BODY ----------
    // Step 3: Append action button cells for each body row.
    // Append actions placeholder cell for each body row model
    (domModel.body || []).forEach((rowModel) => {
      // keep the same cell-object shape used elsewhere: key, value (null), options
      const rawRow = this.data.body[rowModel.rowIndex as number];
      const isSubRow = rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null;
      rowModel.cells.push(
        tcell(key)
          .value(this._createActionButtons(isSubRow || this.config.disableSubRow))
          .class("actions cell")
          .align(isSubRow ? "right" : "center")
          .create()
      );
    });

    // ---------- FOOTER ----------
    // Step 4: Replace "add-button" placeholders in the footer with actual buttons.
    for (const row of domModel.footer) {
      const idx = row.cells.findIndex((c) => c.key === "add-button");
      if (idx >= 0) {
        row.cells[idx] = tcell("add-button").value(this._createAddRowButton()).create();
      }
    }
  }

  /**
   * @private
   * @method _applyInsertionFooterRenderTotal
   *
   * @description
   * Applies the insertion of footer render totals into the DOM model.
   * This function iterates through the footer rows and replaces specific placeholders
   * with dynamically generated grand total (and optionally page total) columns.
   *
   * @param {DOMModel} domModel - The DOM model object containing header, body, and footer arrays.
   * @param {TableConfig} config - The table configuration object, specifically `config.footerOptions.renderTotal`.
   * @returns {void}
   *
   * @example
   *
   * // Assuming domModel has been initialized and config.footerOptions.renderTotal is an array like ["quantity", "total"].
   * this._applyInsertionFooterRenderTotal(domModel, this.config);
   * // The domModel.footer will have cells with keys like "render-total-quantity" replaced
   * // by actual HTML content showing the sum for "quantity" and "total" columns.
   *
   *
   * @summary
   * 1. **Check Configuration**: Verifies if `config.footerOptions.renderTotal` is an array and not empty.
   *    If not, the function returns early as there's nothing to render.
   * 2. **Iterate Footer Rows**: Loops through each `row` in `domModel.footer`.
   * 3. **Find Placeholder Cells**: Within each footer row, it iterates through its `cells` to find
   *    any cell whose `key` starts with "render-total-". These are the placeholders for total columns.
   * 4. **Extract Title**: For each found placeholder, it extracts the original column title
   *    (e.g., "quantity" from "render-total-quantity").
   * 5. **Create Grand Total Column**: It calls `this._createGrandTotalColumn()` with the extracted title
   *    and the current table configuration. This method returns an HTML string containing the formatted
   *    grand total (and page total if pagination is enabled) for that column.
   * 6. **Replace Placeholder**: The placeholder `tcell` in `domModel.footer` is then replaced with a new `tcell`
   *    containing the generated HTML content and appropriate classes for styling.
   *
   */
  _applyInsertionFooterRenderTotal(domModel: DOMModel, config: TableConfig): void {
    // Step 1: Check if renderTotal is configured and is an array. If not, return.
    if (!Array.isArray(config.footerOptions?.renderTotal) || config.footerOptions.renderTotal.length === 0) return;

    // Step 2: Iterate through each footer row in the DOM model.
    for (const row of domModel.footer) {
      // Step 3: Iterate through each cell in the current footer row.
      row.cells.forEach((c, idx) => {
        // Step 3a: Check if the cell's key indicates it's a render-total placeholder.
        if (c.key && c.key.startsWith("render-total-")) {
          // Step 3b: Extract the original column title from the placeholder key.
          const title = c.key.replace("render-total-", "");
          // Step 3c: Replace the placeholder cell with a new tcell containing the grand total HTML.
          // The `_createGrandTotalColumn` method generates the formatted total content.

          row.cells[idx] = tcell(title)
            .value(this._createGrandTotalColumn({ title, colIndex: idx }, this.config))
            .class(`sum ${title}`)
            .create();
        }
      });
    }
  }

  /**
   * @private
   * @method _applyInsertionPagination
   *
   * @description
   * Applies the insertion of pagination controls into the DOM model's footer.
   * This function searches for a "pagination" placeholder in the footer rows
   * and replaces it with the actual HTML element generated by `_createPaginationControls()`.
   *
   * @param {DOMModel} domModel - The DOM model object containing header, body, and footer arrays.
   * @returns {void}
   *
   * @example
   *
   * // Assuming domModel has been initialized and config.pageSize is set.
   * // And domModel.footer contains a cell like:
   * // { key: "pagination", options: { colspan: 5 }, value: "PAGINATION_PLACEHOLDER" }
   * this._applyInsertionPagination(domModel);
   * // The "pagination" placeholder cell in domModel.footer will be replaced
   * // with the actual HTML div containing pagination buttons.
   *
   *
   * @summary
   * 1. **Iterate Footer Rows**: Loops through each `row` in `domModel.footer`.
   * 2. **Find Pagination Placeholder**: Within each footer row, it searches for a cell
   *    whose `key` is "pagination".
   * 3. **Replace Placeholder**: If a "pagination" placeholder cell is found:
   *    - It creates the actual pagination controls HTML element using `this._createPaginationControls()`.
   *    - It replaces the placeholder `tcell` in `domModel.footer` with a new `tcell`
   *      containing the generated pagination element.
   *    - It preserves any `colspan` or `colSpan` options from the original placeholder
   *      to ensure correct layout.
   *
   */
  _applyInsertionPagination(domModel: DOMModel): void {
    // Step 1: Iterate through each footer row in the DOM model.
    for (const row of domModel.footer) {
      // Step 2: Find the index of the cell with the key "pagination".
      const idx = row.cells.findIndex((c) => c.key === "pagination");
      if (idx >= 0) {
        // Step 3: If a "pagination" placeholder is found, replace it with the actual controls.
        // The `_createPaginationControls()` method generates the HTML div for pagination.
        // Preserve the colspan from the original placeholder if it exists.
        row.cells[idx] = tcell("pagination")
          .value(this._createPaginationControls())
          .colspan(row.cells[idx].options?.colSpan || row.cells[idx].options?.colSpan || 1)
          .create();
      }
    }
  }

  /**
   * @private
   * @method _applyInsertionRowTotalColumns
   *
   * @description
   * Applies the insertion of a "Row Total" column into the DOM model.
   * This column displays the sum of values for a specific formula-driven column
   * for parent rows and their associated sub-rows.
   *
   * @param {DOMModel} domModel - The DOM model object containing header, body, and footer arrays.
   * @returns {void}
   *
   * @example
   *
   * // Assuming domModel has been initialized and a column (e.g., "Amount") has a formula.
   * // And there are parent rows with sub-rows.
   * this._applyInsertionRowTotalColumns(domModel);
   * // The domModel.header will have a "Row Total" column.
   * // Each parent row in domModel.body will have a "Row Total" cell spanning itself and its sub-rows.
   * // The footer's colspan will be adjusted.
   *
   *
   * @summary
   * 1. **Check for Formula Column**: It first identifies if any column in `config.bodyOptions`
   *    has a `formula` defined. If not, no row total column is needed, and the function returns.
   * 2. **Determine Insertion Position**: Calculates the `insertPos` for the new column,
   *    considering `autoNumbering` and the `formulaIndex`.
   * 3. **Header Insertion**:
   *    - If header rows exist, it creates a `tcell` for "Row Total".
   *    - This header cell spans all header rows and is inserted at `insertPos`.
   * 4. **Body Insertion**:
   *    - Iterates through each `rowModel` in `domModel.body`.
   *    - For each row, it checks if it's a parent row (not a sub-row).
   *    - If it's a parent row:
   *      - It calculates the `rowspan` for the "Row Total" cell, which includes the parent
   *        row itself plus all its visible sub-rows (considering pagination).
   *      - It computes the `totalVal` by summing the values of the formula column
   *        for the parent and its sub-rows using `__computeRowTotalValue`.
   *      - A `tcell` containing this `totalVal` is created with the calculated `rowspan`
   *        and inserted into the parent row's `cells` array at `insertPos`.
   * 5. **Footer Adjustment**:
   *    - If the footer exists and has cells, it adjusts the `colspan` of the cell
   *      immediately preceding the `insertPos` to accommodate the newly added "Row Total" column.
   *
   */
  _applyInsertionRowTotalColumns(domModel: DOMModel): void {
    // Step 1: Get configuration and find the index of the column with a formula.
    const config = this.config;
    const bodyOpts = config.bodyOptions || [];
    const formulaIndex = bodyOpts.findIndex((opt) => !!opt?.formula);
    // If no formula column is found, there's nothing to total, so return.
    if (formulaIndex === -1) return; // no formula column, nothing to total
    // Step 2: Calculate the position where the "Row Total" column should be inserted.
    // This position is relative to the original data columns, adjusted for auto-numbering.
    const insertPos = (config.autoNumbering ? 1 : 0) + formulaIndex + 1;

    // ---------- HEADER ----------
    // Step 3: Insert the "Row Total" header cell.
    const headerRows = domModel.header || [];
    if (headerRows.length) {
      // Create a header cell object for "Row Total".
      // It will span all header rows.
      const headerCellObj = tcell("row-total")
        .value("Row Total")
        .class("row-total")
        .align("center")
        .rowspan(headerRows.length)
        .create();
      // Insert the header cell into the first header row at the calculated position.
      headerRows[0].cells.splice(formulaIndex, 0, headerCellObj);
    }

    // ------------- BODY --------------
    // We assume domModel.body is in same order as this.data.body for pages (rowIndex points to global index)
    const pageSize = config.pageSize as number;
    const currentPage = this.currentPage;
    const start = pageSize ? (currentPage - 1) * pageSize : 0;
    const end = pageSize ? Math.min(this.data.body.length, start + pageSize) : this.data.body.length;

    // Step 4: Iterate through each body row model to insert row total cells.
    for (const rowModel of domModel.body) {
      // Get the global index and raw row data.
      const gIdx = Number(rowModel.rowIndex);
      const rawRow = this.data.body[gIdx];
      // Determine if the current row is a sub-row.
      const isSubRow = rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null;
      // console.log(rawRow);
      // Row totals are only displayed for parent rows.
      if (!isSubRow) {
        // Step 4a: For parent rows, calculate the rowspan (1 for parent + visible sub-rows).
        const parentUid = rawRow._uid;
        const visibleSubs = __countVisibleSubRowsByUid(this.data.body, parentUid, {
          pageSize,
          currentPage,
          start, // Pass start and end for pagination context
          end, // Pass start and end for pagination context
        });
        // Step 4b: Compute the total value for the parent and its sub-rows.
        const rowSpan = 1 + (visibleSubs || 0);
        const totalVal = __computeRowTotalValue(this.data.body, gIdx, formulaIndex);

        // Create the "Row Total" cell with the calculated value, rowspan, and options.
        const totalCell = tcell("row-total")
          .value(totalVal)
          .class("row-total")
          .rowspan(rowSpan) // The rowspan ensures the total cell spans the parent and all its sub-rows.
          .align("center")
          .options(config.bodyOptions?.[formulaIndex])
          .create();
        // Step 4c: Insert the total cell into the parent row's cells array.
        rowModel.cells.splice(insertPos, 0, totalCell);
      }
      // add empty cell in row-total column for orphan subrow for correct table alignment.
      const isOrphanSubRow = isSubRow && !domModel.body.some((rowModel) => rowModel.uid === rawRow.subrowOfUid);
      if (isOrphanSubRow) {
        const spacer = tcell("spacer").class("row-total spacer").value("").create();
        rowModel.cells.splice(insertPos, 0, spacer);
      }
    }

    // Step 5: Adjust the colspan of the footer cell immediately before the inserted column
    // to accommodate the new "Row Total" column.
    if (domModel.footer[0].cells.length > 0) {
      domModel.footer[0].cells[insertPos - 1].options.colSpan = 2;
    }
  }

  // ---------------------- Variable ------------------------------------------
  /**
   * @private
   * @method _countRenderedColumns
   *
   * @description
   * Counts the total number of columns that will be rendered in the table,
   * considering auto-numbering, row totals, and editable action columns.
   * This function can either derive the count from an existing `domModel`'s header
   * or calculate it based on the table's configuration and internal flags.
   *
   * @param {DOMModel|null} [domModel=null] - An optional DOM model object. If provided and
   *   its header is populated, the column count is derived from it.
   * @returns {number} The total number of columns that will be rendered.
   *
   * @example
   *
   * // Calculate column count based on current configuration
   * const totalCols = this._countRenderedColumns();
   * // totalCols might be 5 (e.g., 3 data columns + autoNumbering + editable)
   *
   * // Calculate column count from a pre-processed DOM model
   * const myDomModel = { header: [{ cells: [{ colspan: 2 }, {}] }], body: [], footer: [] };
   * const totalColsFromModel = this._countRenderedColumns(myDomModel); // Returns 3
   *
   *
   * @summary
   * 1. **From `domModel` (if provided)**:
   *    - If a `domModel` is passed and has header rows, it iterates through the cells
   *      of the first header row.
   *    - For each cell, it sums up its `colspan` (defaulting to 1 if not specified).
   *    - This sum represents the total rendered columns.
   * 2. **From Configuration (fallback)**:
   *    - If no `domModel` is provided or its header is empty, it calculates the count
   *      based on:
   *      - The number of original header columns (`this.data.header.length`).
   *      - An additional column if `config.autoNumbering` is true.
   *      - An additional column if `_isRowTotalRendered` is true.
   *      - An additional column if `config.editable` is true.
   *
   */
  _countRenderedColumns(domModel: DOMModel | null = null): number {
    if (domModel && domModel.header && domModel.header.length > 0) {
      // Step 1a: Get the first header row.
      const top = domModel.header[0];
      let count = 0;
      // Step 1b: Iterate through its cells and sum up their colspans.
      for (const cell of top.cells || []) {
        // Get colspan, defaulting to 1 if not specified.
        const cs = Number(cell.options?.colSpan ?? cell.options?.colSpan ?? 1);
        // Add the colspan to the total count.
        count += Math.max(1, cs);
      }
      // Return the calculated count from the DOM model.
      return count;
    }
    // Step 2: Fallback: compute from config + flags if no valid domModel is provided.
    const cfg = this.config;
    // Step 2a: Calculate the total columns by adding base header columns and optional columns.
    const headerCols = this.data?.header?.length || 0;
    // Return the calculated count based on configuration.
    return (cfg.autoNumbering ? 1 : 0) + headerCols + (this._isRowTotalRendered ? 1 : 0) + (cfg.editable ? 1 : 0);
  }
}

export function createTableElement(data: TableData, config: TableConfig): TableBuilder {
  return new TableBuilder(data, config);
}
