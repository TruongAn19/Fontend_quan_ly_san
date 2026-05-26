import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BookingHistoryComponent } from './booking-history';

describe('BookingHistoryComponent', () => {
  let component: BookingHistoryComponent;
  let fixture: ComponentFixture<BookingHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingHistoryComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingHistoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
