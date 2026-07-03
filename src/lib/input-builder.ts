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
  class?: string;
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

export interface NativeInputAttributes {
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

function sanitizeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyDataAttributes(
  element: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  config?: Partial<InputBuilderConfigOptions>,
) {
  const attrs = config?.attributes;
  if (!Array.isArray(attrs)) return;
  for (const attr of attrs) {
    if (attr?.name) {
      element.setAttribute(attr.name, attr.value);
    }
  }
}

function applyCommonAttributes(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  id: string,
  config: NativeInputAttributes,
) {
  element.id = id;
  element.name = config.name ? String(config.name) : id;

  if (config.placeholder) element.setAttribute("placeholder", String(config.placeholder));
  if (config.disabled) element.setAttribute("disabled", "");
  if (config.readonly) element.setAttribute("readonly", "readonly");
  if (config.required) element.setAttribute("required", "");
  if (config.multiple && element instanceof HTMLInputElement) element.setAttribute("multiple", "");
  if (config.value !== undefined && !(element instanceof HTMLSelectElement)) {
    element.value = String(config.value);
  }

  applyDataAttributes(element, config.config);
}

function buildWrapper(config: NativeInputAttributes) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("input-wrapper");
  if (config.config?.class) {
    wrapper.classList.add(...config.config.class.split(" ").filter(Boolean));
  }
  if (config.config?.display) {
    wrapper.dataset.display = config.config.display;
  }
  if (config.type === "checkbox" && config.config?.style === "toggle") {
    wrapper.classList.add("toggle-switch");
  }
  return wrapper;
}

function createLabel(id: string, text?: string) {
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = text || id;
  return label;
}

export function createNativeInputElement(inputObj: NativeInputAttributes = {}) {
  const defaultConfig: NativeInputAttributes = {
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
      class: "",
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
      createEventListener: false,
      display: "block",
    },
  };

  const config: NativeInputAttributes = {
    ...defaultConfig,
    ...inputObj,
    config: {
      ...defaultConfig.config,
      ...inputObj.config,
    },
  };

  const elementId = config.id
    ? sanitizeId(config.id)
    : config.title
      ? sanitizeId(config.title)
      : `input-${Math.random().toString(36).slice(2, 10)}`;

  if (!config.placeholder && config.title) {
    if (config.type === "select" || config.type === "textarea") {
      config.placeholder = `Pilih ${config.title}`;
    } else {
      config.placeholder = `Isi ${config.title}`;
    }
  }

  if (Array.isArray(config.config?.options)) {
    config.config.options = config.config.options.map((option) =>
      typeof option === "string" ? { value: option, label: option } : option,
    );
  }

  const wrapper = buildWrapper(config);
  const label = config.title && config.config?.useLabel ? createLabel(elementId, config.title) : null;

  switch (config.type) {
    case "textarea": {
      const textarea = document.createElement("textarea");
      applyCommonAttributes(textarea, elementId, config);
      if (config.rows) textarea.rows = config.rows;
      if (config.cols) textarea.cols = config.cols;
      if (label) wrapper.append(label);
      wrapper.append(textarea);
      break;
    }
    case "select": {
      const select = document.createElement("select");
      applyCommonAttributes(select, elementId, config);
      if (config.multiple) select.setAttribute("multiple", "");
      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = config.placeholder || `Pilih ${config.title || elementId}`;
      placeholderOption.classList.add("placeholder");
      placeholderOption.selected = true;
      placeholderOption.disabled = true;
      select.appendChild(placeholderOption);
      const options = (config.config?.options || []) as InputBuilderSelectorOption[];
      for (const option of options) {
        const opt = document.createElement("option");
        opt.value = option.value || String(option.label || "");
        opt.textContent = option.label || option.value || "";
        select.appendChild(opt);
      }
      if (label) wrapper.append(label);
      wrapper.append(select);
      break;
    }
    case "checkbox": {
      const input = document.createElement("input");
      input.type = "checkbox";
      applyCommonAttributes(input, elementId, config);
      if (config.checked) input.checked = true;

      if (config.config?.style === "toggle") {
        if (label && config.config?.position) {
          label.dataset.position = String(config.config.position);
        }
        const control = document.createElement("div");
        control.classList.add("control");
        const slider = document.createElement("span");
        slider.classList.add("slider");
        if (config.config?.content) {
          slider.dataset.shape = String(config.config.content);
        } else {
          slider.dataset.shape = "round";
        }
        control.append(input, slider);
        if (label) wrapper.append(label);
        wrapper.append(control);
        if (!label) {
          const labelText = createLabel(elementId, config.title || elementId);
          wrapper.append(labelText);
        }
      } else {
        if (label) {
          wrapper.append(input, label);
        } else {
          wrapper.append(input);
        }
      }
      break;
    }
    case "radio": {
      const input = document.createElement("input");
      input.type = "radio";
      applyCommonAttributes(input, elementId, config);
      if (config.checked) input.checked = true;
      if (label) {
        wrapper.append(input, label);
      } else {
        wrapper.append(input);
      }
      break;
    }
    case "file": {
      const input = document.createElement("input");
      input.type = "file";
      applyCommonAttributes(input, elementId, config);
      if (config.accept) input.setAttribute("accept", String(config.accept));
      if (config.multiple) input.setAttribute("multiple", "");
      if (config.config?.view) input.dataset.view = String(config.config.view);
      if (config.config?.thumbnail !== undefined) input.dataset.thumbnail = String(config.config.thumbnail);
      if (config.config?.maxUpload !== undefined) input.dataset.maxUpload = String(config.config.maxUpload);
      if (config.config?.maxFileSize !== undefined) input.dataset.maxFileSize = String(config.config.maxFileSize);
      if (config.config?.groupUnallowed !== undefined) input.dataset.groupUnallowed = String(config.config.groupUnallowed);
      if (label) wrapper.append(label);
      wrapper.append(input);
      break;
    }
    default: {
      const input = document.createElement("input");
      applyCommonAttributes(input, elementId, config);
      input.type = config.type || "text";
      if (config.range) input.setAttribute("list", config.range);
      if (label) wrapper.append(label);
      wrapper.append(input);
      break;
    }
  }

  if (config.info) {
    const info = document.createElement("small");
    info.textContent = String(config.info);
    wrapper.appendChild(info);
  }

  return wrapper;
}

