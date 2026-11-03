import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

/**
 * Controla el avance automatico de un carrusel de Bootstrap: permite pausarlo
 * y no avanza solo cuando el usuario pide menos movimiento.
 */
@Directive({
  standalone: false,
  selector: '[appCarrusel]',
  exportAs: 'appCarrusel'
})
export class CarruselDirective implements AfterViewInit, OnDestroy {

  public pausado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private carrusel: any;

  constructor(private elemento: ElementRef<HTMLElement>) { }

  ngAfterViewInit(): void {
    const Carousel = (window as any).bootstrap?.Carousel;
    if(!Carousel){
      return;
    }
    this.carrusel = new Carousel(this.elemento.nativeElement, { ride: false, pause: false });
    if(!this.pausado){
      this.carrusel.cycle();
    }
  }

  ngOnDestroy(): void {
    this.carrusel?.dispose();
  }

  public alternar(){
    this.pausado = !this.pausado;
    if(this.pausado){
      this.carrusel?.pause();
    } else {
      this.carrusel?.cycle();
    }
  }

  @HostListener('mouseenter')
  public alEntrar(){
    this.carrusel?.pause();
  }

  @HostListener('mouseleave')
  public alSalir(){
    if(!this.pausado){
      this.carrusel?.cycle();
    }
  }
}
