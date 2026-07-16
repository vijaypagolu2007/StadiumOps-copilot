export function installTrustedTypesPolicy(): any | null {
  if (!("trustedTypes" in window)) return null;
  return (window as any).trustedTypes.createPolicy("stadiumops", {
    createHTML(input: string) {
      if (/<\s*script|javascript\s*:/i.test(input)) {
        throw new TypeError("Unsafe HTML rejected by Trusted Types policy");
      }
      return input;
    },
    createScriptURL() {
      throw new TypeError("Dynamic script URLs are not allowed");
    },
    createScript() {
      throw new TypeError("Dynamic scripts are not allowed");
    },
  });
}
