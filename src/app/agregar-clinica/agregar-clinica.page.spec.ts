import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarClinicaPage } from './agregar-clinica.page';

describe('AgregarClinicaPage', () => {
  let component: AgregarClinicaPage;
  let fixture: ComponentFixture<AgregarClinicaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarClinicaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
