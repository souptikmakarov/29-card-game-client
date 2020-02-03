import { TestBed } from '@angular/core/testing';

import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SocketClientService = TestBed.get(SocketClientService);
    expect(service).toBeTruthy();
  });
});
