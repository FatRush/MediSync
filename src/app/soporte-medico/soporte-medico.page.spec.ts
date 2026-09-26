import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoporteMedicoPage } from './soporte-medico.page';

describe('SoporteMedicoPage', () => {
  let component: SoporteMedicoPage;
  let fixture: ComponentFixture<SoporteMedicoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SoporteMedicoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
