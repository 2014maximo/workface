// La version para navegador de mammoth no trae tipos propios.
declare module 'mammoth/mammoth.browser.min.js' {
  export function extractRawText(entrada: { arrayBuffer: ArrayBuffer }): Promise<{ value: string, messages: unknown[] }>;
}
