import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpecialtiesPage } from './specialties.page';

describe('SpecialtiesPage', () => {
  let component: SpecialtiesPage;
  let fixture: ComponentFixture<SpecialtiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialtiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
