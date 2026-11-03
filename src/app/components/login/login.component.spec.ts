import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let componente: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login', 'register', 'resetPassword', 'loginGoogle']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cada campo tiene una etiqueta asociada', () => {
    const elemento: HTMLElement = fixture.nativeElement;
    elemento.querySelectorAll('input').forEach(campo => {
      expect(elemento.querySelector(`label[for="${campo.id}"]`)).withContext(campo.id).not.toBeNull();
    });
  });

  it('REGISTRAR y RECORDAR CLAVE se pueden usar con teclado', () => {
    const botones = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.btn-enlace'));
    expect(botones.map(b => b.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('un ingreso fallido conserva el email y borra la clave', fakeAsync(() => {
    auth.login.and.resolveTo(null as any);
    componente.form.patchValue({ email: 'nombre@correo.com', password: 'clave-de-prueba' });

    componente.submit();
    tick(1500);

    expect(componente.form.value.email).toBe('nombre@correo.com');
    expect(componente.form.value.password).toBe('');
    expect(componente.enviando).toBeFalse();
  }));

  it('no envia dos veces mientras una solicitud sigue en curso', () => {
    auth.login.and.returnValue(new Promise(() => {}));
    componente.form.patchValue({ email: 'nombre@correo.com', password: 'clave-de-prueba' });

    componente.submit();
    componente.submit();

    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it('un registro invalido conserva lo escrito y no llama al servicio', () => {
    componente.ajustesRegistrar();
    componente.form.patchValue({ email: 'nombre@correo.com', password: 'uno', confirmPassword: 'dos' });

    componente.submit();

    expect(auth.register).not.toHaveBeenCalled();
    expect(componente.form.value.email).toBe('nombre@correo.com');
    expect(componente.form.value.password).toBe('uno');
  });

  it('al crear la cuenta navega al perfil', fakeAsync(() => {
    auth.register.and.resolveTo({ additionalUserInfo: { isNewUser: true } } as any);
    componente.ajustesRegistrar();
    componente.form.patchValue({ email: 'nombre@correo.com', password: 'clave-de-prueba', confirmPassword: 'clave-de-prueba' });

    componente.submit();
    tick(1500);

    expect(router.navigate).toHaveBeenCalledWith(['profile']);
  }));

  it('el boton de Google aparece al ingresar y registrar, y lleva al perfil', fakeAsync(() => {
    auth.loginGoogle.and.resolveTo({} as any);
    const boton = () => fixture.nativeElement.querySelector('.btn-google') as HTMLButtonElement;
    expect(boton()).not.toBeNull();

    componente.ajustesRecordarClave();
    fixture.detectChanges();
    tick();
    expect(boton()).toBeNull();

    componente.ajustesRegistrar();
    fixture.detectChanges();
    tick();
    boton().click();
    tick(1500);

    expect(auth.loginGoogle).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['profile']);
    expect(componente.enviando).toBeFalse();
  }));

  it('si Google falla no navega y reactiva el formulario', fakeAsync(() => {
    auth.loginGoogle.and.resolveTo(null as any);

    componente.ingresoGoogle();
    tick(1500);

    expect(router.navigate).not.toHaveBeenCalled();
    expect(componente.enviando).toBeFalse();
  }));

  it('acepta emails con mayusculas y signo mas', () => {
    componente.form.patchValue({ email: 'Nombre+cv@Correo.com' });
    expect(componente.form.get('email')?.valid).toBeTrue();
  });
});
