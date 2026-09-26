import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailAppointmentPage } from './detail-appointment.page';

describe('DetailAppointmentPage', () => {
  let component: DetailAppointmentPage;
  let fixture: ComponentFixture<DetailAppointmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailAppointmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
