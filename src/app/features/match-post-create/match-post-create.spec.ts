import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MatchPostCreateComponent } from './match-post-create';

describe('MatchPostCreateComponent', () => {
  let component: MatchPostCreateComponent;
  let fixture: ComponentFixture<MatchPostCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPostCreateComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPostCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
