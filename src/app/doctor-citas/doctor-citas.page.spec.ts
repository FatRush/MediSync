import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorCitasPage } from './doctor-citas.page';

describe('DoctorCitasPage', () => {
  let component: DoctorCitasPage;
  let fixture: ComponentFixture<DoctorCitasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorCitasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
