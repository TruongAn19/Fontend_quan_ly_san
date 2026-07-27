import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EquipmentDetail } from '../models/equipment.model';

interface EquipmentResponse {
  id: number;
  name: string;
  price: number;
  rentalPricePerDay?: number;
  rentalPricePerPlay?: number;
  factory?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly API_URL = `${environment.apiBaseUrl}/equipments`;
  private http = inject(HttpClient);

  /**
   * GET /api/v1/equipments/:id — fetch equipment detail for rental/booking flows.
   * Map BE `image` → `imageUrl` để khớp naming convention FE.
   */
  getEquipmentById(equipmentId: number): Observable<ApiResponse<EquipmentDetail>> {
    return this.http.get<ApiResponse<EquipmentResponse>>(`${this.API_URL}/${equipmentId}`).pipe(
      map((res) => ({
        ...res,
        data: res.data
          ? {
              id: res.data.id,
              name: res.data.name,
              price: res.data.price,
              rentalPricePerDay: res.data.rentalPricePerDay,
              rentalPricePerPlay: res.data.rentalPricePerPlay,
              factory: res.data.factory,
              imageUrl: res.data.image,
            }
          : (res.data as unknown as EquipmentDetail),
      })),
    );
  }
}
