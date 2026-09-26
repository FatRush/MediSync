import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterDoctorPage } from './register-doctor.page';

describe('RegisterDoctorPage', () => {
  let component: RegisterDoctorPage;
  let fixture: ComponentFixture<RegisterDoctorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterDoctorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
