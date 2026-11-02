import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';

const BASE_DE_DATOS = 'workface';
const PERFILES = 'perfiles';

// Los campos de fecha guardan texto (AAAA-MM-DD). Un objeto Date es un valor por defecto antiguo
// que el usuario nunca eligio, asi que al leerlo se deja el campo vacio.
function quitarFechasPorDefecto(valor: any): any {
  if(valor instanceof Date){
    return '';
  }
  if(Array.isArray(valor)){
    return valor.map(quitarFechasPorDefecto);
  }
  if(valor && typeof valor === 'object'){
    return Object.fromEntries(Object.entries(valor).map(([clave, dato]) => [clave, quitarFechasPorDefecto(dato)]));
  }
  return valor;
}

/**
 * Guarda el perfil y sus imagenes en IndexedDB, solo en este navegador.
 * Es el almacenamiento del plan gratuito.
 */
@Injectable({
  providedIn: 'root'
})
export class PerfilLocalService {

  private conexion?: Promise<IDBPDatabase>;

  private abrir(): Promise<IDBPDatabase> {
    this.conexion ??= openDB(BASE_DE_DATOS, 1, {
      upgrade: baseDeDatos => {
        baseDeDatos.createObjectStore(PERFILES);
      }
    });
    return this.conexion;
  }

  async obtener(uid: string): Promise<any> {
    return quitarFechasPorDefecto(await (await this.abrir()).get(PERFILES, uid));
  }

  async guardar(uid: string, perfil: any): Promise<void> {
    // Pide al navegador no borrar estos datos si se queda sin espacio.
    navigator.storage?.persist?.();
    await (await this.abrir()).put(PERFILES, perfil, uid);
  }
}
