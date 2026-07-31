import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Equipment } from '../models/equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly API_URL = `${environment.apiBaseUrl}/equipments`;
  private http = inject(HttpClient);

  getEquipmentById(equipmentId: number): Observable<ApiResponse<Equipment>> {
    return this.http.get<ApiResponse<Equipment>>(`${this.API_URL}/${equipmentId}`);
  }
}
