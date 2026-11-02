import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';

const BASE_DE_DATOS = 'workface';
const PERFILES = 'perfiles';

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
    return (await this.abrir()).get(PERFILES, uid);
  }

  async guardar(uid: string, perfil: any): Promise<void> {
    // Pide al navegador no borrar estos datos si se queda sin espacio.
    navigator.storage?.persist?.();
    await (await this.abrir()).put(PERFILES, perfil, uid);
  }
}
