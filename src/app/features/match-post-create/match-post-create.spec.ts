import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPostCreate } from './match-post-create';

describe('MatchPostCreate', () => {
  let component: MatchPostCreate;
  let fixture: ComponentFixture<MatchPostCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPostCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchPostCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
