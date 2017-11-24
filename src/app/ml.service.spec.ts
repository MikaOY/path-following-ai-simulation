import { TestBed, inject } from '@angular/core/testing';

import { MlserviceService } from './mlservice.service';

describe('MlserviceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MlserviceService]
    });
  });

  it('should be created', inject([MlserviceService], (service: MlserviceService) => {
    expect(service).toBeTruthy();
  }));
});
