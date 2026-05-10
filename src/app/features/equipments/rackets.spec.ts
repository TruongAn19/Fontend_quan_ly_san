import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rackets } from './rackets';

describe('Rackets', () => {
  let component: Rackets;
  let fixture: ComponentFixture<Rackets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rackets],
    }).compileComponents();

    fixture = TestBed.createComponent(Rackets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
