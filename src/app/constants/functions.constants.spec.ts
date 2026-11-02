import { descargarCv } from './functions.constants';

describe('descargarCv', () => {
  it('informa el error sin lanzar excepcion si no existe el elemento', async () => {
    const error = spyOn(console, 'error');
    await descargarCv('no-existe', 'pdf');
    expect(error).toHaveBeenCalled();
  });
});
