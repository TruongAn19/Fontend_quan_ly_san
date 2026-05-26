import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RentalComponent } from './rental';

describe('RentalComponent', () => {
  let component: RentalComponent;
  let fixture: ComponentFixture<RentalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
