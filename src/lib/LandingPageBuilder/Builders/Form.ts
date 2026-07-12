import { BuilderRegistry } from "../BuilderRegistry";
import type { iBasicNode } from "../interface";
import { DOMRenderer } from "../Renderers/DOMRenderer";
import { NodeTransformer } from "../Utils/NodeTransformer";
import { FileUploader } from "./FileUploader";
import { InputBuilder } from "./Input";

export interface iFormConfig {
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
}

export class FormBuilder {
  private config: Required<iFormConfig>;
  private submitButtonId: string | undefined = undefined;

  // Gunakan DOMRenderer internal khusus untuk merakit struktur form
  private engine = new DOMRenderer();
  private emptyRegistry = new BuilderRegistry();


  constructor(config: iFormConfig = {}) {
    const defaultConfig: Required<iFormConfig> = {
      id: "",
      name: "",
      title: "",
      description: "",
      method: "post",
      action: "",
      className: "native form",
      submitButton: true,
      buttonText: "Submit",
      buttonClass: "button primary",
      resetOnSubmit: false,
      resetOnComplete: true,
      createEventListener: true,
      minHeight: "400px",
      footer: null
    };
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Helper internal untuk memindai string HTML mentah atau element hidup 
   * guna mencari tombol submit yang sudah ada (untuk link ID)
   */
  private scanForSubmitButton(input: any, formId: string): string | null {
    if (!input) return null;
    let btn: HTMLElement | null = null;

    if (input instanceof HTMLInputElement) {
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

  /**
   * REFACTOR TOTAL: Merakit Form menggunakan struktur iBasicNode[] murni
   */
  public create(inputs: Array<any | HTMLElement | string> | any): HTMLElement {

    const randomSuffix = Math.random().toString(36).substring(7);
    const formId = this.config.id ? `form ${this.config.id}`.replace(/\s+/g, "-") : `form-${randomSuffix}`;

    const formContentArray: iBasicNode[] = [];
    const inputItems = Array.isArray(inputs) ? inputs : [inputs];

    // Iterasi dan transformasikan setiap input secara murni
    inputItems.forEach((input: any) => {

      // ==========================================
      // KASUS A: Input berupa HTMLElement Hidup (Tanpa Wrapper Palsu!)
      // ==========================================
      if (input instanceof HTMLElement) {
        this.submitButtonId = this.scanForSubmitButton(input, formId) || this.submitButtonId;

        // Langsung push element fisiknya ke dalam content array form
        formContentArray.push({ content: input } as any);
      }

      // ==========================================
      // KASUS B: Input berupa Raw HTML String
      // ==========================================
      else if (typeof input === "string") {
        const foundId = this.scanForSubmitButton(input, formId);
        if (foundId) this.submitButtonId = foundId;

        // Masukkan langsung string HTML-nya agar di-parse alami oleh DOMRenderer
        formContentArray.push({ content: input } as any);
      }

      // ==========================================
      // KASUS C: Input berupa Group Node (<fieldset>)
      // ==========================================
      else if (input && typeof input === "object" && "group" in input && Array.isArray(input.group)) {
        const fieldsetContentArray: iBasicNode[] = [];

        const legendText = input.legend || input.title;
        if (legendText) {
          fieldsetContentArray.push({ tagName: "legend", content: String(legendText) });
        }
        if (input.description) {
          fieldsetContentArray.push({ tagName: "p", className: "group-desc", content: String(input.description) });
        }

        // Iterasi anak-anak di dalam group secara murni
        input.group.forEach((innerInput: any) => {
          if (typeof innerInput === "string") {
            const foundId = this.scanForSubmitButton(innerInput, formId);
            if (foundId) this.submitButtonId = foundId;
            fieldsetContentArray.push({ isRoot: true, content: innerInput } as any);
          } else {
            // InputBuilder melahirkan HTMLElement murni dengan isRoot internalnya sendiri
            const inputEl = innerInput instanceof HTMLElement ? innerInput : InputBuilder.create(innerInput);
            const foundId = this.scanForSubmitButton(inputEl, formId);
            if (foundId) this.submitButtonId = foundId;

            // Langsung dorong element fisiknya ke dalam tumpukan fieldset
            fieldsetContentArray.push({ content: inputEl } as any);
          }
        });

        if (input.submitButton) {
          const btnId = `btn-${formId}-grp-${Math.random().toString(36).substring(7)}`;
          this.submitButtonId = btnId;
          fieldsetContentArray.push({
            tagName: "button",
            id: btnId,
            className: this.config.buttonClass,
            type: "submit",
            form: formId,
            content: this.config.buttonText
          });
        }

        formContentArray.push({
          tagName: "fieldset",
          className: input.class || "",
          content: fieldsetContentArray
        });
      }

      // ==========================================
      // KASUS D: Input berupa Parameter Objek Basic Tunggal
      // ==========================================
      else {
        // InputBuilder.create() mengelola isRoot dan melahirkan <div class="input-wrapper"> murni
        const inputEl = InputBuilder.create(input);
        if (this.config.submitButton) {
          this.submitButtonId = this.scanForSubmitButton(inputEl, formId) || this.submitButtonId;
        }

        // Dorong langsung objek elemen fisiknya ke dalam formContentArray
        formContentArray.push({ content: inputEl } as any);
      }
    });

    // 3. Tambahkan Tombol Submit Default di akhir jika belum ada
    if (!this.submitButtonId && this.config.submitButton) {
      const defaultBtnId = `btn-${formId}`;
      this.submitButtonId = defaultBtnId;

      formContentArray.push({
        tagName: "button",
        id: defaultBtnId,
        className: this.config.buttonClass,
        type: "submit",
        form: formId,
        style: "margin-top: 1rem; padding: 1rem; float: right;", // Gunakan CSS untuk kerapihan posisi
        content: this.config.buttonText
      });
    }

    // 4. Tambahkan elemen Footer jika didefinisikan
    if (this.config.footer) {
      formContentArray.push({ content: this.config.footer } as any);
    }

    // 5. BUNGKUS KE BLUEPRINT FORM UTAMA
    const masterFormBlueprint: iBasicNode = {
      tagName: "form",
      id: formId,
      className: this.config.className,
      method: this.config.method as any,
      style: `min-height: ${this.config.minHeight}; background: transparent;`,
      ...(this.config.action ? { action: this.config.action } : {}),

      content: formContentArray, // Diisi tumpukan element murni bebas dari div pembungkus palsu!

      onCreated: (el: HTMLElement) => {
        this.attachFormListener(el as HTMLFormElement);
      }
    };

    return this.engine.render(NodeTransformer.resolveContentNode(masterFormBlueprint), this.emptyRegistry);
  }

  /**
   * Logika Listener asinkronus (FileUploader, Event submit, CustomEvent) tetap aman terisolasi di sini
   */
  private attachFormListener(form: HTMLFormElement): void {
    console.log("Form Listeners Attached")

    if (typeof FileUploader !== "undefined" && typeof FileUploader.initAll === "function") {
      FileUploader.initAll(form);
    }

    const toggleLoadingState = (success: boolean) => {
      form.classList.remove("loading");
      form.querySelectorAll(".field").forEach((f) => f.classList.remove("error"));
      if (!success) form.querySelectorAll(".field").forEach((f) => f.classList.add("error"));
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
      const button = document.getElementById(this.submitButtonId);
      button?.addEventListener("click", (e) => {
        e.preventDefault();
        form.requestSubmit(button);
      });
    }
  }
}