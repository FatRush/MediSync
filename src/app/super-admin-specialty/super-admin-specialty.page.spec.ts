import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuperAdminSpecialtyPage } from './super-admin-specialty.page';

describe('SuperAdminSpecialtyPage', () => {
  let component: SuperAdminSpecialtyPage;
  let fixture: ComponentFixture<SuperAdminSpecialtyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminSpecialtyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
