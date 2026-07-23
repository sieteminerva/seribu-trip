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
    // const inputs = data.content;
    // console.log(inputs)
    const form = document.createElement("form");
    form.className = this.config.className;

    const randomSuffix = Math.random().toString(36).substring(7);
    const formId = this.config.id ? `form ${this.config.id}`.replace(/\s+/g, "-") : `form-${randomSuffix}`;
    form.id = formId;
    const inputItems = Array.isArray(inputs) ? inputs : [inputs];

    // Iterasi dan transformasikan setiap input secara murni
    inputItems.forEach((input: any) => {
      // console.log(inputs)

      // ==========================================
      // KASUS A: Input berupa HTMLElement Hidup (Tanpa Wrapper Palsu!)
      // ==========================================
      if (input instanceof HTMLElement) {
        this.submitButtonId = this.scanForSubmitButton(input, formId) || this.submitButtonId;

        // Langsung push element fisiknya ke dalam content array form
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
      else if (input && typeof input === "object") {
        // console.log("group", { input })
        if ("group" in input) {

          const fieldset = document.createElement("fieldset");
          fieldset.className = input.class || "";

          const legendText = input.legend || input.title;
          if (legendText) {
            const legend = document.createElement("legend")
            legend.textContent = String(legendText)
            fieldset.append(legend);
          }
          if (input.description) {
            const desc = document.createElement("p");
            desc.className = "group-desc";
            desc.textContent = String(input.description)
            fieldset.append(desc);
          }

          // Iterasi anak-anak di dalam group secara murni
          input.group.forEach((innerInput: any) => {
            // console.log({ innerInput })
            if (typeof innerInput === "string") {
              const foundId = this.scanForSubmitButton(innerInput, formId);
              if (foundId) this.submitButtonId = foundId;
              fieldset.insertAdjacentHTML("beforeend", innerInput as any);
            } else if (typeof innerInput === "object") {
              const inputEl = InputBuilder.create(innerInput)
              fieldset.append(inputEl)
            } else {
              // InputBuilder melahirkan HTMLElement murni dengan isRoot internalnya sendiri
              const inputEl = innerInput instanceof HTMLElement ? innerInput : InputBuilder.create(innerInput);
              const foundId = this.scanForSubmitButton(inputEl, formId);
              if (foundId) this.submitButtonId = foundId;

              // Langsung dorong element fisiknya ke dalam tumpukan fieldset
              fieldset.append(inputEl as any);
            }
          });

          if (input.submitButton) {
            const btnId = `btn-${formId}-grp-${Math.random().toString(36).substring(7)}`;
            this.submitButtonId = btnId;
            const submitBtn = document.createElement("button");
            submitBtn.id = btnId;
            submitBtn.className = this.config.buttonClass;
            submitBtn.type = "submit";

            submitBtn.textContent = this.config.buttonText;

            fieldset.append(submitBtn);
          }

          // const fieldset = document.createElement("fieldset");

          form.appendChild(fieldset);
        }

        // ==========================================
        // KASUS D: Input berupa Parameter Objek Basic Tunggal
        // ==========================================
        // else {
        //   // InputBuilder.prepare() mengelola isRoot dan melahirkan <div class="input-wrapper"> murni
        //   const inputEl = InputBuilder.prepare(input);
        //   if (this.config.submitButton) {
        //     this.submitButtonId = this.scanForSubmitButton(inputEl, formId) || this.submitButtonId;
        //   }

        //   // Dorong langsung objek elemen fisiknya ke dalam formContentArray
        //   form.append(inputEl as any);
        // }
      }
    });

    // 3. Tambahkan Tombol Submit Default di akhir jika belum ada
    if (!this.submitButtonId && this.config.submitButton) {
      const defaultBtnId = `btn-${formId}`;
      const submitBtn = document.createElement("button");
      submitBtn.id = defaultBtnId;
      submitBtn.className = this.config.buttonClass;
      submitBtn.type = "submit";
      submitBtn.style = "margin-top: 1rem; padding: 1rem; float: right;"
      submitBtn.textContent = this.config.buttonText;

      form.append(submitBtn)
    }

    // 4. Tambahkan elemen Footer jika didefinisikan
    if (this.config.footer) {
      form.append(this.config.footer as any);
    }

    if (this.config.createEventListener) {
      this.attachFormListener(form)
    }

    // console.log(form)
    return form;
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