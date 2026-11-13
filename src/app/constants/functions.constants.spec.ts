import { comprimirImagen } from './functions.constants';

const crearImagen = (ancho: number, alto: number, tipo: string): Promise<Blob> => new Promise(resolver => {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext('2d')!;
  contexto.fillStyle = '#3366cc';
  contexto.fillRect(0, 0, ancho / 2, alto);
  lienzo.toBlob(imagen => resolver(imagen!), tipo);
});

describe('comprimirImagen', () => {
  it('limita el ancho y mantiene la proporcion', async () => {
    const resultado = await comprimirImagen(await crearImagen(3000, 1500, 'image/png'), { anchoMaximo: 800, formato: 'image/jpeg' });
    const medidas = await createImageBitmap(resultado);
    expect(resultado.type).toBe('image/jpeg');
    expect(medidas.width).toBe(800);
    expect(medidas.height).toBe(400);
  });

  it('conserva la transparencia en PNG', async () => {
    const resultado = await comprimirImagen(await crearImagen(3000, 1500, 'image/png'), { anchoMaximo: 800, formato: 'image/png' });
    const lienzo = document.createElement('canvas');
    const contexto = lienzo.getContext('2d')!;
    lienzo.width = 800;
    lienzo.height = 400;
    contexto.drawImage(await createImageBitmap(resultado), 0, 0);
    expect(resultado.type).toBe('image/png');
    expect(contexto.getImageData(700, 200, 1, 1).data[3]).toBe(0);
  });
});

