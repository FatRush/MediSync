import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecretariaPage } from './secretaria.page';

describe('SecretariaPage', () => {
  let component: SecretariaPage;
  let fixture: ComponentFixture<SecretariaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretariaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
