import { EnvironmentInjector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';

import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
  let service: FirebaseService;

  // Como el AngularFirestore real, exige un contexto de inyeccion al crear la coleccion.
  const firestoreFalso = {
    collection: () => {
      inject(EnvironmentInjector);
      return {
        add: () => Promise.resolve('add'),
        doc: () => {
          inject(EnvironmentInjector);
          return {
            get: () => of('get'),
            set: () => Promise.resolve('set'),
            update: () => Promise.resolve('update')
          };
        }
      };
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AngularFirestore, useValue: firestoreFalso }]
    });
    service = TestBed.inject(FirebaseService);
  });

  it('accede a Firestore dentro de un contexto de inyeccion', async () => {
    expect(await service.create('c', {}) as unknown).toBe('add');
    expect(await service.createUid('c', {}, 'id') as unknown).toBe('set');
    expect(await service.update('c', 'id', {}) as unknown).toBe('update');
    expect(await service.getById('c', 'id')).not.toBeNull();
  });
});
