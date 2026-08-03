import type { iBuilderConfig, iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";
import { TableBuilder } from "../Table/Table";
import { FileUploader } from "./FileUploader";
import { InputBuilder } from "./Input";

export type FormElementType =
  | "@container"
  | "@form"
  | "@form>group"
  | "@form>group>legend"
  | "@form>group>desc"
  | "@form>actions"
  | "@form>actions>submit"
  | "@form>actions>submit-group"
  | "@form>footer";

export interface iFormConfig extends iBuilderConfig<FormElementType> {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  method?: "get" | "post";
  action?: string;
  className?: string;
  submitButton?: boolean;
  buttonText?: string;
  buttonClass?: string;
  resetOnSubmit?: boolean;
  resetOnComplete?: boolean;
  createEventListener?: boolean;
  minHeight?: string;
  footer?: HTMLElement | string | null;
  onSubmit?: null | Function
}

export class FormBuilder extends Builder<FormElementType, iFormConfig> {
  readonly builderId: keyof iBuilderRegistry = "form";
  readonly name: keyof iBuilderRegistry = "form";
  readonly stylesheet: string = "./Form.css";

  private submitButtonId: string | undefined = undefined;

  #inputs: any[] = [];

  constructor(config: Partial<iFormConfig> = {}) {
    super();

    const defaultSelectors = {
      "@container": { tagName: "div", className: "form-widget-wrapper" },
      "@form": { tagName: "form", className: "native form" },
      "@form>group": { tagName: "fieldset", className: "form-group" },
      "@form>group>legend": { tagName: "legend", className: "group-title" },
      "@form>group>desc": { tagName: "p", className: "group-desc" },
      "@form>actions": { tagName: "div", className: "form-actions" },
      "@form>actions>submit": { tagName: "button", className: "button primary", type: "submit" as "submit" },
      "@form>actions>submit-group": { tagName: "button", className: "button primary", type: "button" as "button" },
      "@form>footer": { tagName: "div", className: "form-footer" }
    };

    const defaultConfig: Required<iFormConfig> = {
      id: "",
      name: "",
      title: "",
      description: "",
      method: "post",
      action: "submit",
      className: "native form",
      submitButton: true,
      buttonText: "Submit",
      buttonClass: "button primary",
      resetOnSubmit: false,
      resetOnComplete: true,
      createEventListener: true,
      minHeight: "400px",
      footer: null,
      themeId: "default",
      selectors: defaultSelectors,
      namespace: null,
      emit: null,
      onSubmit: (data: any) => { },
    };
    this.config = this.resolveConfig(defaultConfig, config);
  }

  /**
   * REFACTOR TOTAL: Merakit Form menggunakan struktur iBasicNode[] murni
   */
  public prepare(inputs: Array<any | HTMLElement | string> | any, _config: Partial<iFormConfig> = {}): HTMLElement {
    // const inputs = data.content;
    // console.log(inputs)
    this.#inputs = Array.isArray(inputs) ? inputs : [inputs];

    const wrapper = this.render("@container", inputs);

    const form = this.render("@form", inputs) as HTMLFormElement;
    const formId = form.id;

    // Iterasi dan transformasikan setiap input secara murni
    this.#inputs.forEach((input: any) => {

      if (input instanceof HTMLElement) {
        this.submitButtonId = this.scanForSubmitButton(input, formId) || this.submitButtonId;
        form.append(input);
      }

      // ==========================================
      // KASUS B: Input berupa Raw HTML String
      // ==========================================
      else if (typeof input === "string") {
        const foundId = this.scanForSubmitButton(input, formId);
        if (foundId) this.submitButtonId = foundId;
        // Masukkan langsung string HTML-nya agar di-parse alami oleh DOMRenderer
        form.insertAdjacentHTML("beforeend", input as any);
      }

      // ==========================================
      // KASUS C: Input berupa Group Node (<fieldset>)
      // ==========================================
      else if (input && typeof input === "object" && "group" in input) {
        const fieldset = this.renderGroup(input, formId);
        // console.log("group", { input })
        form.appendChild(fieldset);
      }

      // ==========================================
      // KASUS D: Input berupa Parameter Objek Basic Tunggal
      // ==========================================
      else {
        // InputBuilder.prepare() mengelola isRoot dan melahirkan <div class="input-wrapper"> murni
        const inputEl = new InputBuilder({ formId: formId } as any).create(input);
        if (this.config.submitButton) {
          this.submitButtonId = this.scanForSubmitButton(inputEl, formId) || this.submitButtonId;
        }

        // Dorong langsung objek elemen fisiknya ke dalam formContentArray
        form.append(inputEl as any);
      }

    });

    if (!this.submitButtonId && this.config.submitButton) {
      const defaultSubmitBtn = this.render("@form>actions>submit", { isGroupBtn: false, formId }) as HTMLButtonElement;
      this.submitButtonId = defaultSubmitBtn.id;
      form.append(defaultSubmitBtn)
    }

    if (this.config.footer) {
      if (this.config.footer instanceof HTMLElement) {
        form.appendChild(this.config.footer);
      } else {
        const footerEl = this.render("@form>footer", this.config.footer) as HTMLElement;
        form.appendChild(footerEl);
      }
    }

    if (wrapper && form) wrapper.appendChild(form);

    // console.log(form)
    return this.load("@container") as HTMLElement;
  }

  /**
   * Recursively renders a group (fieldset) and its child inputs or sub-groups.
   */
  private renderGroup(groupInput: any, formId: string): HTMLElement {
    const fieldset = this.render("@form>group", groupInput, true) as HTMLElement;

    if (groupInput.group && Array.isArray(groupInput.group)) {
      groupInput.group.forEach((innerInput: any, _index: number) => {
        // console.log(hasTable, index)

        // Case 1: Raw HTML String
        if (typeof innerInput === "string") {
          const foundId = this.scanForSubmitButton(innerInput, formId);
          if (foundId) this.submitButtonId = foundId;
          fieldset.insertAdjacentHTML("beforeend", innerInput as any);

        }
        // Case 2: Nested Group Object -> RECURSE!
        else if (innerInput && typeof innerInput === "object" && "group" in innerInput) {
          const nestedFieldset = this.renderGroup(innerInput, formId);
          if (innerInput.id) nestedFieldset.id = innerInput.id;
          if (innerInput.table !== undefined) {
            // console.log(innerInput.table.content)
            const groupSubmitBtn = this.render("@form>actions>submit-group", { isGroupBtn: false, groupId: innerInput.id }, true) as HTMLButtonElement;
            const table = new TableBuilder(innerInput.table.content)
            const tableEl = table.create()
            if (innerInput.table.id) tableEl.id = innerInput.table.id;

            groupSubmitBtn.onclick = (e) => {
              e.preventDefault();
              const is = (nestedFieldset as HTMLFieldSetElement).elements
              // console.log(is)
              const groupValues = [];
              for (const element of is) {
                if (!element) break;
                if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
                  if ((element as HTMLInputElement).checked) {
                    groupValues.push(element.value);
                  }
                } else {
                  groupValues.push((element as HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement).value);
                  // data[element.name] = element.value;
                }
              }
              table.addRow(groupValues as any[])
            }
            // console.log(tableEl)
            nestedFieldset.append(groupSubmitBtn, tableEl);
          }

          fieldset.appendChild(nestedFieldset);

        }
        // Case 3: Regular Input Item or DOM Element
        else {
          const inputEl = innerInput instanceof HTMLElement
            ? innerInput
            : new InputBuilder({ formId: formId } as any).create(innerInput);

          const foundId = this.scanForSubmitButton(inputEl, formId);
          if (foundId) this.submitButtonId = foundId;

          fieldset.append(inputEl as any);
        }
      });
    }

    // Handle submit button per group level if specified
    if (groupInput.submitButton) {
      const submitBtn = this.render("@form>actions>submit", { isGroupBtn: true, formId }, true) as HTMLButtonElement;
      this.submitButtonId = submitBtn.id;
      fieldset.appendChild(submitBtn);
    }

    return fieldset;
  }

  public initialize(): void {
    const formElement = this.load("@form") as HTMLFormElement;
    if (formElement && this.config.createEventListener) {
      this.attachFormListener(formElement);
    }
    console.log(`[Form Engine v2] Form ID "${formElement?.id}" successfully compiled with active listeners.`);
  }

  protected template(typeKey: FormElementType, el: HTMLElement, payload?: any): void {
    switch (typeKey) {
      case "@container":
        el.style.minHeight = this.config.minHeight;
        break;

      case "@form": {
        const form = el as HTMLFormElement;
        const randomSuffix = Math.random().toString(36).substring(7);
        form.id = this.config.id ? `form-${this.config.id}`.replace(/\s+/g, "-") : `form-${randomSuffix}`;
        form.className = `${this.config.className} ${form.className || ""}`.trim();
        form.method = this.config.method;
        if (this.config.action) form.action = this.config.action;
        break;
      }

      case "@form>group": {
        if (payload?.class) el.className = `${el.className} ${payload.class}`.trim();

        const legendText = payload?.legend || payload?.title;
        if (legendText) {
          const legend = document.createElement("legend"); // Element internal pendukung kaku
          legend.className = "group-title";
          legend.textContent = String(legendText);
          el.appendChild(legend);
        }

        if (payload?.description) {
          const desc = document.createElement("p");
          desc.className = "group-desc";
          desc.textContent = String(payload.description);
          el.appendChild(desc);
        }
        break;
      }

      case "@form>actions>submit": {
        const btn = el as HTMLButtonElement;
        btn.className = `${this.config.buttonClass} ${btn.className || ""}`.trim();
        btn.type = "submit";
        btn.textContent = this.config.buttonText;

        if (payload?.isGroupBtn) {
          btn.id = payload.formId ? `btn-${payload.formId}` : `btn-group-${Math.random().toString(36).substring(7)}`;
        } else {
          btn.id = `btn-${payload?.formId || "default"}`;
          btn.style.marginTop = "1rem";
          btn.style.padding = "1rem";
          btn.style.float = "right";
        }
        break;
      }

      case "@form>actions>submit-group": {
        const btn = el as HTMLButtonElement;
        btn.className = `${this.config.buttonClass} ${btn.className || ""}`.trim();
        btn.type = "button";
        btn.textContent = "Submit Item";

        if (payload?.isGroupBtn) {
          btn.id = payload.groupId ? `btn-${payload.groupId}` : `btn-group-${Math.random().toString(36).substring(7)}`;
        } else {
          btn.id = `btn-${payload?.groupId || "default"}`;
          btn.style.marginTop = "1rem";
          btn.style.padding = "1rem";
          btn.style.float = "right";
        }
        break;
      }

      case "@form>footer":
        el.textContent = typeof payload === "string" ? payload : (payload?.text || "");
        break;
    }
  }


  public unmount(): void {
    // Jalankan ritual pencabutan listener kustom jika disematkan esok sore
    this.destroy(); // Bersihkan saku memori Map privat!
  }

  /**
   * Logika Listener asinkronus (FileUploader, Event submit, CustomEvent) tetap aman terisolasi di sini
   */
  private attachFormListener(form: HTMLFormElement): void {
    // console.log("Form Listeners Attached")

    if (typeof FileUploader !== "undefined" && typeof FileUploader.initAll === "function") {
      FileUploader.initAll(form);
    }

    const toggleLoadingState = (success: boolean) => {
      form.classList.remove("loading");
      form.querySelectorAll(".field").forEach((f) => f.classList.remove("error"));
      if (!success) {
        form.querySelectorAll(".field").forEach((f) => f.classList.add("error"));
      }
    };

    form.addEventListener("submit", async (e) => {
      form.classList.add("loading");
      e.preventDefault();

      const submitter = e.submitter;
      if (this.submitButtonId && submitter && submitter.id !== this.submitButtonId) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData as any);

      let files = {};
      if (typeof FileUploader !== "undefined" && typeof FileUploader.getFilesForGoogleDrive === "function") {
        files = await FileUploader.getFilesForGoogleDrive(form.id);
      }
      // if (typeof FileUploader !== "undefined" && typeof FileUploader.getFiles === "function") {
      //   files = await FileUploader.getFiles(form.id);
      // }
      const dataWithFiles = Object.keys(files).length > 0 ? Object.assign({}, data, files) : data;
      console.log({ dataWithFiles })
      form.dispatchEvent(
        new CustomEvent("formSubmit", {
          bubbles: true,
          detail: {
            formId: form.id,
            data: dataWithFiles,
            complete: (success: boolean, messageConfig: any, resetForm: boolean) => {
              if (messageConfig) console.log("message system not implemented yet!")
              toggleLoadingState(success);
              if (resetForm || this.config.resetOnComplete) form.reset();
            },
            reset: () => form.reset()
          }
        }));
    });

    if (this.submitButtonId) {
      const button = this.load("@form>actions>submit") as HTMLButtonElement;

      console.log(button.id)

      if (button) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          // Memicu form validation HTML5 native secara legal lintas penunjuk elemen!
          form.requestSubmit(button);
        });
      }
    }
  }


  /**
   * Helper internal untuk memindai string HTML mentah atau element hidup 
   * guna mencari tombol submit yang sudah ada (untuk link ID)
   */
  private scanForSubmitButton(input: any, formId: string): string | null {
    if (!input) return null;
    let btn: HTMLElement | null = null;

    if (input instanceof HTMLButtonElement) {
      btn = input.type === "submit" ? input : input.querySelector("button[type=submit], input[type=submit]");
    } else if (typeof input === "string") {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = input.trim();
      btn = wrapper.querySelector("button[type=submit], input[type=submit]");
    }

    if (btn) {
      if (!btn.id) btn.id = `btn-${formId}`;
      btn.setAttribute("form", formId);
      return btn.id;
    }
    return null;
  }
}