import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuperAdminSecretariaPage } from './super-admin-secretaria.page';

describe('SuperAdminSecretariaPage', () => {
  let component: SuperAdminSecretariaPage;
  let fixture: ComponentFixture<SuperAdminSecretariaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminSecretariaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
