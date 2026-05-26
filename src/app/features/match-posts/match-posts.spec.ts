import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MatchPostsComponent } from './match-posts';

describe('MatchPostsComponent', () => {
  let component: MatchPostsComponent;
  let fixture: ComponentFixture<MatchPostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPostsComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPostsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
