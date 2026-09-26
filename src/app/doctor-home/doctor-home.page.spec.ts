import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorHomePage } from './doctor-home.page';

describe('DoctorHomePage', () => {
  let component: DoctorHomePage;
  let fixture: ComponentFixture<DoctorHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
