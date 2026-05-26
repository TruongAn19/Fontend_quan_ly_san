import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PaymentCallbackComponent } from './payment-callback';

describe('PaymentCallbackComponent', () => {
  let component: PaymentCallbackComponent;
  let fixture: ComponentFixture<PaymentCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCallbackComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentCallbackComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
