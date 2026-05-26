import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RentalHistoryComponent } from './rental-history';

describe('RentalHistoryComponent', () => {
  let component: RentalHistoryComponent;
  let fixture: ComponentFixture<RentalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalHistoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalHistoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
