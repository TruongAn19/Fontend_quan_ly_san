import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPosts } from './match-posts';

describe('MatchPosts', () => {
  let component: MatchPosts;
  let fixture: ComponentFixture<MatchPosts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPosts],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPosts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
