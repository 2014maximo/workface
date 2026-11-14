/** Misma forma que el diccionario en español, con cualquier texto en cada hoja.
 *  Si a un idioma le falta una clave, el build falla. */
export type Diccionario<T> = { [K in keyof T]: T[K] extends string ? string : Diccionario<T[K]> };
