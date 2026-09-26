import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyAppointmentsPage } from './my-appointments.page';

describe('MyAppointmentsPage', () => {
  let component: MyAppointmentsPage;
  let fixture: ComponentFixture<MyAppointmentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyAppointmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
