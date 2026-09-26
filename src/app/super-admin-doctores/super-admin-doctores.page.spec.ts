import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuperAdminDoctoresPage } from './super-admin-doctores.page';

describe('SuperAdminDoctoresPage', () => {
  let component: SuperAdminDoctoresPage;
  let fixture: ComponentFixture<SuperAdminDoctoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminDoctoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
