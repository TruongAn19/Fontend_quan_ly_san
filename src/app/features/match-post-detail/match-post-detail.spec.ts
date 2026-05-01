import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPostDetail } from './match-post-detail';

describe('MatchPostDetail', () => {
  let component: MatchPostDetail;
  let fixture: ComponentFixture<MatchPostDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPostDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPostDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
