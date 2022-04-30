import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderFrasesHomeComponent } from './slider-frases-home.component';

describe('SliderFrasesHomeComponent', () => {
  let component: SliderFrasesHomeComponent;
  let fixture: ComponentFixture<SliderFrasesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SliderFrasesHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderFrasesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
