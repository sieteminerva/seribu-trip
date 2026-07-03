import { FileUploader } from "./file-uploader";
import { createNativeInputElement } from "./input-builder";

/**
 * @typedef {Object} FormConfig
 * @property {string} [id=""] - The ID of the form element.
 * @property {string} [name=""] - The name attribute of the form element.
 * @property {string} [title=""] - A title for the form (not directly rendered by this function, but useful for context).
 * @property {string} [description=""] - A description for the form (not directly rendered by this function, but useful for context).
 * @property {string} [method="post"] - The HTTP method to use when submitting the form.
 * @property {string} [action=""] - The URL to which the form data will be sent.
 * @property {string} [class="ui form"] - CSS classes to apply to the form element.
 * @property {string} [buttonText="Submit"] - The text content for the submit button.
 * @property {string} [buttonClass="ui button violeta"] - CSS classes to apply to the submit button.
 * @property {boolean} [submitButton=true] - Create submit button.
 * @property {boolean} [resetOnSubmit=true] - Whether the form should reset after submitting form.
 * @property {boolean} [resetOnComplete=true] - Whether the form should reset after a successful submission completed.
 * @property {boolean} [createEventListener=true] - Create `formSubmit` Custom Event Listener.
 * @property {string} [group="two"] - Semantic UI grid class for grouping fields (e.g., "two fields", "three fields").
 * @property {string} [minHeight="300px"] - CSS min-height for the form.
 * @property {HTMLElement|string|null} [footer=null] - Footer content (HTML string or HTMLElement).
 */

interface FormConfig {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  method?: string;
  action?: string;
  class?: string;
  buttonText?: string;
  buttonClass?: string;
  submitButton?: boolean;
  resetOnSubmit?: boolean;
  resetOnComplete?: boolean;
  createEventListener?: boolean;
  group?: string;
  minHeight?: string;
  footer?: HTMLElement | string | null;
}

/**
 * Generates an HTML form element populated with input fields based on the provided item configuration.
 * It can handle single input objects, arrays of input objects, or grouped inputs.
 *
 * @param {Array<Object|HTMLElement|string>|Object} inputs - A single input configuration object, an array of input configuration objects, or an HTMLElement/string representing an input.
 *   Each object in the array should conform to the `inputObj` structure expected by `createInputElement`.
 *   If an object has a `group` property (an array of input objects), it will be rendered as a grouped field.
 * @param {FormConfig} [config={}] - Configuration options for the form itself.
 * @returns {HTMLFormElement} The constructed HTML form element.
 *
 * @example
 * // Example 1: Basic form with a single text input
 * const myForm = generateFormElement({ title: "Name", type: "text" }, { id: "user-form" });
 * document.body.appendChild(myForm);
 *
 * // Example 2: Form with multiple inputs and a custom submit button
 * const inputs = [
 *   { title: "Email", type: "email" },
 *   { title: "Password", type: "password" }
 * ];
 * const contactForm = generateFormElement(inputs, { id: "contact-form", buttonText: "Send Message" });
 * document.body.appendChild(contactForm);
 *
 */

export function generateFormElement(inputs: Array<Object | HTMLElement | string> | Object, config: FormConfig = {}): HTMLFormElement {
  const defaultConfig = {
    id: "",
    name: "",
    title: "",
    description: "",
    method: "post",
    action: "",
    class: "ui form",
    submitButton: true,
    buttonText: "Submit",
    buttonClass: "ui button violeta",
    resetOnSubmit: false,
    resetOnComplete: true,
    createEventListener: true,
    group: "",
    minHeight: "400px",
    footer: null,
  };

  config = { ...defaultConfig, ...config };

  function _createSubmitButton(target: HTMLElement, formId: string): string {
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = config.buttonClass as any;
    submitButton.id = `btn-${formId}`;
    submitButton.setAttribute("form", formId);
    submitButton.textContent = config.buttonText as any;
    target.appendChild(submitButton);
    return submitButton.id;
  }

  /**
   * Create a menu item element for the tab menu.
   * @param {HTMLElement|string|null} footer - Tab item.
   */
  function _createFooter(footer: HTMLElement | string | null) {
    if (footer instanceof HTMLElement) {
      return footer;
    } else {
      const footerEl = document.createElement("div");
      footerEl.className = `ui fitted basic segment footer`;
      // footerEl.style.display = "block";
      // footerEl.style.position = "absolute";
      footerEl.style.textAlign = "center";
      footerEl.style.fontSize = "smaller";
      footerEl.style.marginTop = "3em";
      // footerEl.style.width = "100%";
      // footerEl.style.bottom = "-30px";
      footerEl.innerHTML = footer as string;
      return footerEl;
    }
  }

  // Step 1: Generate a unique form ID if not provided
  const randomSuffix = Math.random().toString(36).substring(7);
  const form = document.createElement("form");
  let formId = ``;
  if (config.id) {
    formId = `form ${config.id}`.replace(/\s+/g, "-");
  } else {
    // Step 2: Fallback to a random ID if no config.id is given
    formId = `form-${randomSuffix}`;
  }
  // Step 3: Set form attributes
  form.id = formId;
  form.name = formId;
  form.className = config.class as any;
  form.method = config.method as any;
  if (config.action) form.action = config.action;
  form.style.minHeight = config.minHeight as any;
  form.style.background = "transparent";

  // Step 4: Initialize submit button ID tracker
  let submitButtonId = undefined;

  // Step 5: Process input items
  if (Array.isArray(inputs) && inputs.length > 0) {
    for (const input of inputs) {
      let template = null;

      // Step 5.1: Handle HTMLElement inputs
      if (input instanceof HTMLElement) {
        submitButtonId = _linkSubmitButton(input, form.id) || submitButtonId;
        template = input;
        // Step 5.2: Handle string inputs (raw HTML)
      } else if (typeof input === "string") {
        const foundSubmitButtonId = _linkSubmitButton(input, form.id);
        if (foundSubmitButtonId) submitButtonId = foundSubmitButtonId;
        form.insertAdjacentHTML("beforeend", input);
        // Step 5.3: Handle grouped inputs
      } else if (input && typeof input === "object" && "group" in input && Array.isArray((input as { group?: unknown }).group)) {
        const groupConfig = input as {
          group: Array<Record<string, unknown> | HTMLElement | string>;
          legend?: string;
          title?: string;
          description?: string;
          class?: string;
          submitButton?: boolean;
        };
        const groupEl = document.createElement("fieldset");
        if (groupConfig.class) groupEl.className = String(groupConfig.class);

        const legendText = groupConfig.legend || groupConfig.title;
        if (legendText) {
          const legend = document.createElement("legend");
          legend.textContent = String(legendText);
          groupEl.appendChild(legend);
        }

        if (groupConfig.description) {
          const description = document.createElement("p");
          description.textContent = String(groupConfig.description);
          groupEl.appendChild(description);
        }

        for (const innerInput of groupConfig.group) {
          if (typeof innerInput === "string") {
            const foundSubmitButtonId = _linkSubmitButton(innerInput, form.id);
            if (foundSubmitButtonId) submitButtonId = foundSubmitButtonId;
            groupEl.insertAdjacentHTML("beforeend", innerInput);
            continue;
          }

          const innerInputEl = innerInput instanceof HTMLElement ? innerInput : createNativeInputElement(innerInput as Record<string, unknown>);
          const foundSubmitButtonId = _linkSubmitButton(innerInputEl, form.id);
          if (foundSubmitButtonId) submitButtonId = foundSubmitButtonId;
          groupEl.append(innerInputEl);
        }

        if (groupConfig.submitButton) {
          const buttonContainer = document.createElement("div");
          buttonContainer.className = "input-wrapper";
          submitButtonId = _createSubmitButton(buttonContainer, form.id);
          groupEl.appendChild(buttonContainer);
        }

        template = groupEl;
        // Step 5.4: Handle single input objects
      } else {
        template = createNativeInputElement(input);
        if (config.submitButton) {
          submitButtonId = _linkSubmitButton(template, form.id) || submitButtonId;
        }
      }

      // Step 5.5: Append the generated template to the form
      if (template) {
        form.append(template);
      }
    }
  }

  // Step 6: Check if a submit button was linked or created. If not, create a default one.
  if (!submitButtonId && config.submitButton) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "input-wrapper";
    buttonContainer.style.justifyContent = "end";
    buttonContainer.style.marginTop = "1rem";
    buttonContainer.style.padding = "1rem";
    submitButtonId = _createSubmitButton(buttonContainer, form.id);

    form.append(buttonContainer);
    if (config.footer) form.append(_createFooter(config.footer));
  }

  // Step 7: Attach form submit listeners after the form is fully constructed
  if (config.createEventListener) {
    setTimeout(() => {
      const { resetOnSubmit, resetOnComplete } = config;
      attachFormListener(form.id, { submitButtonId, resetOnSubmit, resetOnComplete });
    }, 0);
  }
  // console.log(`[FormBuilder] Form generated with ID: ${form.id}`, form);
  return form;
}

interface FormListenerConfig {
  submitButtonId?: string;
  resetOnSubmit?: boolean;
  resetOnComplete?: boolean;
  autocompleted?: boolean;
  [key: string]: any; // Allow additional properties
}
/**
 * @typedef {Object} FormListenerConfig
 * @property {string} [submitButtonId=""] - Create submit button.
 * @property {boolean} [autocompleted=false] - Create submit button.
 * @property {boolean} [resetOnSubmit=false] - If `true`, the form will be reset after the `formSubmit` event is dispatched.
 * @property {boolean} [resetOnComplete=false] - If `true`, the form will be reset after the `formSubmit` event is dispatched.
 * Attaches a submit event listener to a form and optionally links an external submit button.
 * When the form is submitted, it dispatches a custom `formSubmit` event with the form's ID and data.
 *
 * @param {string | HTMLFormElement} id
 * @param {FormListenerConfig} config
 * @return {void}
 *
 * @example
 * // Assuming a form with id="my-form" and a button with id="submit-my-form"
 * // <form id="my-form"><input type="text" name="name"></form>
 * // <button id="submit-my-form">Submit</button>
 * attachFormListener("my-form", "submit-my-form", true);
 *
 * // Listen for the custom event
 * document.getElementById("my-form").addEventListener("formSubmit", (e) => {
 *   console.log("Form submitted:", e.detail.formId, e.detail.data);
 * });
 *
 */
export function attachFormListener(id: string | HTMLFormElement, config: FormListenerConfig = {}) {


  const defaultConfig = {
    submitButtonId: "",
    resetOnComplete: false,
    autocompleted: false,
  };

  config = { ...defaultConfig, ...config };

  let form = null as HTMLFormElement | null;

  // Helper loading state
  const _loading = (success: boolean, message: string[]) => {
    const msgConfig = { ...message, element: id } as any;
    if (!form) return;
    if (success) {
      form.classList.remove("loading");
      form.querySelectorAll(".field").forEach((field) => {
        field.classList.remove("error");
      });
      msgConfig.type = "info";
      // createMessageElement(msgConfig);
    } else {
      form.classList.remove("loading");
      form.querySelectorAll(".field").forEach((field) => {
        field.classList.add("error");
      });
      msgConfig.type = "error";
      msgConfig.duration = null;
      // createMessageElement(msgConfig);
    }
  };

  const reset = () => {
    if (!form) return;
    form.reset();
  };

  if (typeof id === "string") {
    form = document.getElementById(id) as HTMLFormElement | null;
  } else if (id instanceof HTMLFormElement) {
    form = id;
  }

  if (!form) {
    console.warn(`[FormListener] No form found with id="${id}"`);
    return;
  }
  // Your JavaScript class definition and instantiation here
  if (typeof FileUploader !== "undefined" && typeof FileUploader === "function") {
    FileUploader.initAll(form as any);
  } else {
    console.log("File Uploader not available!");
  }

  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", async (e) => {
      form.classList.add("loading");
      // Prevent browser default (page reload)
      e.preventDefault();
      // If we enforce a specific submit button, check the submitter
      const submitter = e.submitter; // native property in modern browsers
      if (config.submitButtonId && submitter && submitter.id !== config.submitButtonId) {
        // Ignore submits coming from other buttons/inputs
        return;
      }

      // Convert form data to a plain object
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // get input file values and merge it to the data object
      const files = await FileUploader.getFilesForGoogleDrive(form.id);
      const dataWithFiles = Object.keys(files).length > 0 ? Object.assign({}, data, files) : data;

      // Dispatch custom event
      form.dispatchEvent(
        new CustomEvent("formSubmit", {
          bubbles: true,
          detail: {
            formId: form.id,
            data: dataWithFiles,
            complete: (success: boolean, messageConfig: any, resetForm: boolean) => {
              _loading(success, messageConfig);
              if (resetForm || config.resetOnComplete) {
                reset();
              }
            },
            reset,
          },
        }),
      );

      if (config.autocompleted) {
        setTimeout(() => {
          form.classList.remove("loading");
        }, 300);
      }
    });

    // Attach manual trigger to designated button (if provided)
    if (config.submitButtonId) {
      const button = document.getElementById(config.submitButtonId);
      if (button) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          form.requestSubmit(button); // native submit with submitter tracking
        });
      }
    }
  }
}

/**
 * Helper function to find a submit button within an input element or string,
 * attach an ID if missing, and link it to the specified form.
 *
 * @param {HTMLElement|string} input - The input element (or its HTML string representation)
 *   to search for a submit button. This could be a button itself, an input of type submit,
 *   or a container holding such elements.
 * @param {string} formId - The ID of the form that the submit button should be associated with.
 * @returns {string|null} The ID of the found/linked submit button, or `null` if no submit button was found.
 *
 * @example
 * // Linking an existing button element
 * const myButton = document.createElement('button');
 * myButton.type = 'submit';
 * myButton.textContent = 'Send';
 * const btnId = _linkSubmitButton(myButton, 'my-form'); // btnId will be 'btn-my-form'
 *
 * // Linking a submit button from an HTML string
 * const htmlString = '<div class="actions"><button type="submit">Go</button></div>';
 * const btnIdFromString = _linkSubmitButton(htmlString, 'another-form'); // btnIdFromString will be 'btn-another-form'
 *
 */
export function _linkSubmitButton(input: HTMLElement | string, formId: string): string | null {
  // Step 1: Return null immediately if input is falsy
  if (!input) return null;
  let btn = null;
  // Step 2: Handle HTMLElement input
  if (input instanceof HTMLButtonElement || input instanceof HTMLInputElement) {
    if (input.type === "submit") {
      btn = input;
    } else {
      btn = input.querySelector("button[type=submit], input[type=submit]");
    }
  }
  // Step 3: Handle string input (parse as HTML)
  if (typeof input === "string") {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = input.trim();
    btn = wrapper.querySelector("button[type=submit], input[type=submit]");
  }
  // Step 4: If a submit button is found, assign an ID and link it to the form
  if (btn) {
    // Step 4.1: Assign a default ID if the button doesn't have one
    if (!btn.id) btn.id = `btn-${formId}`;
    // Step 4.2: Set the 'form' attribute to explicitly link the button to the form
    btn.setAttribute("form", formId);
    return btn.id;
  }
  // Step 5: Return null if no submit button was found
  return null;
}
