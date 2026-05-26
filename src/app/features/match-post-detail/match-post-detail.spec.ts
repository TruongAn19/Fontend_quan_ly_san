import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MatchPostDetailComponent } from './match-post-detail';

describe('MatchPostDetailComponent', () => {
  let component: MatchPostDetailComponent;
  let fixture: ComponentFixture<MatchPostDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPostDetailComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPostDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
