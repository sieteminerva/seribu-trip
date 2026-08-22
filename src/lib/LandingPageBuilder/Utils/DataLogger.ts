const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export function DataLogger(DEBUG_MODE: "DATA" | "INFO" | boolean = false, properties: { functionName?: string, action?: string, type?: "normal" | "table", separator?: string }, data: any | null = null) {

  if (DEBUG_MODE) {
    const name = `${COLORS.cyan}⪻${properties.functionName}⪼${COLORS.reset}`;
    const action = `${COLORS.yellow}[action: ${properties.action}]${COLORS.reset}`;
    const header = `${name} ${action}`;
    const type = properties.type ? properties.type : "normal";
    const separator = properties.separator ? properties.separator : "\n";

    if (DEBUG_MODE === "DATA") {
      if (data !== null) {

        const dataParts = Object.keys(data).map((key) => {
          let value: any = data[key];
          if (typeof value === "string") value = `'${value}'`;
          else if (Array.isArray(value)) value = `[${value.join(",")}]`;
          else if (value instanceof Date) value = `'${value.toDateString()}'`;
          else if (typeof value === "object") value = JSON.stringify(value);
          return `${COLORS.green}${key}${COLORS.reset}: ${COLORS.magenta}${value}${COLORS.reset}`;
        });

        if (type === "table") {
          console.log(`${header}`);
          console.table(data);
        } else {
          console.log(`${header}\n${dataParts.join(separator)}`);
        }

      } else {
        console.log(header);
      }
    } else if (DEBUG_MODE === "INFO") {
      console.log(`${header}: ${COLORS.white}${data.message}${COLORS.reset}`);
    }
  }
}
