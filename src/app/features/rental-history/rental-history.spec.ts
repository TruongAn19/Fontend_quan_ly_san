import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RentalHistory } from './rental-history';

describe('RentalHistory', () => {
  let component: RentalHistory;
  let fixture: ComponentFixture<RentalHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
