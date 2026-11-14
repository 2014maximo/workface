import { TranslatePipe } from '@ngx-translate/core';
import { proveerTraduccionPruebas } from '../../i18n/pruebas';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContactComponent } from './form-contact.component';

describe('FormContactComponent', () => {
  let component: FormContactComponent;
  let fixture: ComponentFixture<FormContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormContactComponent ],
      imports: [ TranslatePipe ],
      providers: [ proveerTraduccionPruebas() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
