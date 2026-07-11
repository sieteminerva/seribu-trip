import { BuilderRegistry } from "../BuilderRegistry";
import type { iBasicNode, iBasicInputNode, InputBuilderSelectorOption, InputType } from "../interface";
import { DOMRenderer } from "../Renderers/DOMRenderer";
import { NodeTransformer } from "../Utils/NodeTransformer";
import { FileUploader } from "./FileUploader";

const engine = new DOMRenderer();
const emptyRegistry = new BuilderRegistry();

export class InputBuilder {
  private static sanitizeId(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Static Factory Method to generate a single standardized input element wrapper
   */
  public static create(inputSchema: iBasicInputNode = {}): HTMLElement {
    const defaultSchema: Partial<iBasicInputNode> = {
      type: "text",
      id: "",
      title: "",
      placeholder: "",
      rows: 3,
      multiple: false,
      disabled: false,
      readonly: false,
      required: false,
      checked: false,
      config: {
        attributes: [],
        style: "",
        field: "field",
        className: "",
        options: [],
        position: "left",
        icon: "",
        content: "",
        action: null,
        actionMode: "",
        wide: null,
        useLabel: true,
        view: "",
        thumbnail: false,
        maxUpload: undefined,
        maxFileSize: undefined,
        groupUnallowed: false,
        display: "block"
      }
    };

    const schema = {
      ...defaultSchema,
      ...inputSchema,
      config: { ...defaultSchema.config, ...inputSchema.config }
    } as iBasicInputNode;

    const elementId = schema.id
      ? this.sanitizeId(schema.id)
      : schema.title
        ? this.sanitizeId(schema.title)
        : `input-${Math.random().toString(36).slice(2, 10)}`;

    if (!schema.placeholder && schema.title) {
      schema.placeholder = (schema.type === "select" || schema.type === "textarea")
        ? `Pilih ${schema.title}`
        : `Isi ${schema.title}`;
    }

    if (Array.isArray(schema.config?.options)) {
      schema.config.options = schema.config.options.map((option: InputBuilderSelectorOption | string) =>
        typeof option === "string" ? { value: option, label: option } : option
      );
    }

    const commonAttrs: Record<string, any> = {
      id: elementId,
      name: schema.name ? String(schema.name) : elementId,
    };

    if (schema.placeholder) commonAttrs.placeholder = String(schema.placeholder);
    if (schema.disabled) commonAttrs.disabled = "";
    if (schema.readonly) commonAttrs.readonly = "readonly";
    if (schema.required) commonAttrs.required = "";

    if (Array.isArray(schema.config?.attributes)) {
      schema.config.attributes.forEach((attr: any) => {
        if (attr?.name) commonAttrs[attr.name] = attr.value;
      });
    }

    const wrapperClasses = ["input-wrapper"];
    if (schema.config?.className) wrapperClasses.push(...schema.config.className.split(" ").filter(Boolean));
    if (schema.type === "checkbox" && schema.config?.style === "toggle") wrapperClasses.push("toggle-switch");

    const wrapperNode: iBasicNode = {
      tagName: "div",
      className: wrapperClasses.join(" "),
      ...(schema.config?.display ? { "data-display": schema.config.display } : {}),
      content: []
    };

    const contentArray = wrapperNode.content as any[];
    const labelNode = schema.title && schema.config?.useLabel ? {
      tagName: "label",
      for: elementId,
      content: schema.title
    } : null;

    switch (schema.type as InputType) {
      case "textarea": {
        if (labelNode) contentArray.push(labelNode);
        contentArray.push({
          tagName: "textarea",
          ...commonAttrs,
          ...(schema.rows ? { rows: String(schema.rows) } : {}),
          ...(schema.cols ? { cols: String(schema.cols) } : {})
        });
        break;
      }
      case "select": {
        if (labelNode) contentArray.push(labelNode);
        const selectNode: any = {
          tagName: "select",
          ...commonAttrs,
          ...(schema.multiple ? { multiple: "" } : {}),
          content: [
            {
              tagName: "option",
              className: "placeholder",
              value: "",
              disabled: "",
              selected: "",
              content: schema.placeholder || `Pilih ${schema.title || elementId}`
            }
          ]
        };
        const options = schema.config?.options || [];
        options.forEach((option: any) => {
          selectNode.content.push({
            tagName: "option",
            value: option.value || String(option.label || ""),
            content: option.label || option.value || ""
          });
        });
        contentArray.push(selectNode);
        break;
      }
      case "checkbox": {
        const checkboxAttrs = { ...commonAttrs, type: "checkbox", ...(schema.checked ? { checked: "" } : {}) };
        if (schema.config?.style === "toggle") {
          if (labelNode) (labelNode as any)["data-position"] = String(schema.config.position || "left");
          const controlWrapper: iBasicNode = {
            tagName: "div",
            className: "control",
            content: [
              { tagName: "input", ...checkboxAttrs },
              { tagName: "span", className: "slider", "data-shape": String(schema.config?.content || "round") }
            ]
          };
          if (labelNode) contentArray.push(labelNode);
          contentArray.push(controlWrapper);
          if (!labelNode) contentArray.push({ tagName: "label", for: elementId, content: schema.title || elementId });
        } else {
          const inputBlock = { tagName: "input", ...checkboxAttrs };
          if (labelNode) contentArray.push(inputBlock, labelNode); else contentArray.push(inputBlock);
        }
        break;
      }
      case "radio": {
        contentArray.push({ tagName: "input", ...commonAttrs, type: "radio", ...(schema.checked ? { checked: "" } : {}) });
        if (labelNode) contentArray.push(labelNode);
        break;
      }
      case "file": {
        if (labelNode) contentArray.push(labelNode);
        contentArray.push({
          tagName: "input",
          ...commonAttrs,
          "data-uploader": "",
          type: "file",
          ...(schema.accept ? { accept: String(schema.accept) } : {}),
          ...(schema.multiple ? { multiple: "" } : {}),
          ...(schema.config?.view ? { "data-view": String(schema.config.view) } : {}),
          ...(schema.config?.thumbnail !== undefined ? { "data-thumbnail": String(schema.config.thumbnail) } : {}),
          ...(schema.config?.maxUpload !== undefined ? { "data-max-upload": String(schema.config.maxUpload) } : {}),
          ...(schema.config?.maxFileSize !== undefined ? { "data-max-file-size": String(schema.config.maxFileSize) } : {}),
          ...(schema.config?.groupUnallowed !== undefined ? { "data-group-unallowed": String(schema.config.groupUnallowed) } : {})
        });
        break;
      }
      default: {
        if (labelNode) contentArray.push(labelNode);
        contentArray.push(
          {
            tagName: "input", ...commonAttrs,
            type: schema.type || "text",
            ...(schema.range ? { list: schema.range } : {})
          }
        );
        break;
      }
    }

    if (schema.info) contentArray.push({ tagName: "small", content: String(schema.info) });

    const element = engine.render(NodeTransformer.resolveContentNode(wrapperNode), emptyRegistry);

    if (element && schema.value) {
      const input = element.querySelectorAll("input, textarea, select")[0] as HTMLInputElement | HTMLSelectElement
      if (input.type !== "file") input.value = schema.value as any;
      else if (input.type === "file" && input.hasAttribute("data-uploader")) {
        // input.className = "file";
        new FileUploader(input, {
          maxUpload: 5,
          accept: ["image/png", ".jpg"],
          view: "list"
        });

        // console.log(input)

      }
    }

    return element;
  }
}