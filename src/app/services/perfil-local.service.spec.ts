import { TestBed } from '@angular/core/testing';

import { PerfilLocalService } from './perfil-local.service';

describe('PerfilLocalService', () => {
  let service: PerfilLocalService;
  const uid = (nombre: string) => `${nombre}-${Date.now()}-${Math.random()}`;

  beforeEach(() => {
    service = TestBed.inject(PerfilLocalService);
  });

  it('devuelve undefined si el usuario no tiene perfil', async () => {
    expect(await service.obtener(uid('nuevo'))).toBeUndefined();
  });

  it('conserva los datos, fechas e imagenes guardados', async () => {
    const id = uid('completo');
    const perfil = { formBasic: { primerNombre: 'Ana', fecha: new Date(0), imgFondo: 'data:image/jpeg;base64,' + 'A'.repeat(500000) } };
    await service.guardar(id, perfil);
    expect(await service.obtener(id)).toEqual(perfil);
  });

  it('reemplaza el perfil al volver a guardar', async () => {
    const id = uid('reemplazo');
    await service.guardar(id, { formBasic: { primerNombre: 'Ana' } });
    await service.guardar(id, { formBasic: { primerNombre: 'Eva' } });
    expect((await service.obtener(id)).formBasic.primerNombre).toBe('Eva');
  });

  it('separa los perfiles de cada usuario', async () => {
    const [uno, dos] = [uid('uno'), uid('dos')];
    await service.guardar(uno, { formBasic: { primerNombre: 'Ana' } });
    await service.guardar(dos, { formBasic: { primerNombre: 'Eva' } });
    expect((await service.obtener(uno)).formBasic.primerNombre).toBe('Ana');
    expect((await service.obtener(dos)).formBasic.primerNombre).toBe('Eva');
  });
});
