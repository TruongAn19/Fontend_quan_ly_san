import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ProductListResponse, ProductResponseDTO } from '../models/product.model';
import { Equipment, EquipmentListResponse } from '../models/equipment.model';
import { UserResponseDTO } from '../models/user.model';
import {
  AdminBookingDTO,
  AdminBookingDetailResponse,
  AdminBookingListResponse,
  CancelBookingResponse,
  SubPitchDTO,
} from '../models/booking.model';
import {
  RentalRefundStatus,
  AdminRentalDetailResponse,
  RentalToolDTO,
  RentalToolListResponse,
} from '../models/rental.model';
import {
  DashboardStats,
  EquipmentStatistics,
  RevenueByDate,
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API_URL}/dashboard`);
  }

  getRevenueStats(startDate: string, endDate: string): Observable<ApiResponse<RevenueByDate>> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<ApiResponse<RevenueByDate>>(`${this.API_URL}/products/statistics/revenue`, { params });
  }

  getEquipmentStats(
    startDate?: string,
    endDate?: string,
    courtId?: number,
  ): Observable<ApiResponse<EquipmentStatistics>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (courtId) params = params.set('courtId', courtId);
    return this.http.get<ApiResponse<EquipmentStatistics>>(`${this.API_URL}/equipment-statistics`, { params });
  }

  getUsers(): Observable<ApiResponse<UserResponseDTO[]>> {
    return this.http.get<ApiResponse<UserResponseDTO[]>>(`${this.API_URL}/users`);
  }

  createUser(payload: FormData): Observable<ApiResponse<UserResponseDTO>> {
    return this.http.post<ApiResponse<UserResponseDTO>>(`${this.API_URL}/users`, payload);
  }

  updateUser(userId: number, payload: FormData): Observable<ApiResponse<UserResponseDTO>> {
    return this.http.put<ApiResponse<UserResponseDTO>>(`${this.API_URL}/users/${userId}`, payload);
  }

  deleteUser(userId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/users/${userId}`);
  }

  updateUserRole(userId: number, role: string): Observable<ApiResponse<UserResponseDTO>> {
    return this.http.put<ApiResponse<UserResponseDTO>>(`${this.API_URL}/users/${userId}/role`, { role });
  }

  getProducts(
    page: number = 1,
    search: string = '',
  ): Observable<ApiResponse<ProductListResponse>> {
    let params = new HttpParams().set('page', page.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<ProductListResponse>>(`${this.API_URL}/products`, { params });
  }

  getProductOptions(): Observable<ApiResponse<ProductResponseDTO[]>> {
    return this.http.get<ApiResponse<ProductResponseDTO[]>>(`${this.API_URL}/products/options`);
  }

  createProduct(payload: FormData): Observable<ApiResponse<ProductResponseDTO>> {
    return this.http.post<ApiResponse<ProductResponseDTO>>(`${this.API_URL}/products`, payload);
  }

  updateProduct(productId: number, payload: FormData): Observable<ApiResponse<ProductResponseDTO>> {
    return this.http.put<ApiResponse<ProductResponseDTO>>(`${this.API_URL}/products/${productId}`, payload);
  }

  deleteProduct(productId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/products/${productId}`);
  }

  getSubPitches(productId: number): Observable<ApiResponse<SubPitchDTO[]>> {
    const params = new HttpParams().set('productId', productId.toString());
    return this.http.get<ApiResponse<SubPitchDTO[]>>(`${this.API_URL}/sub-pitches`, { params });
  }

  createSubPitch(
    payload: { productId: number; name: string; pitchType: string },
  ): Observable<ApiResponse<SubPitchDTO>> {
    return this.http.post<ApiResponse<SubPitchDTO>>(`${this.API_URL}/sub-pitches`, payload);
  }

  updateSubPitch(
    id: number,
    payload: { name?: string; pitchType?: string },
  ): Observable<ApiResponse<SubPitchDTO>> {
    return this.http.put<ApiResponse<SubPitchDTO>>(`${this.API_URL}/sub-pitches/${id}`, payload);
  }

  deleteSubPitch(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/sub-pitches/${id}`);
  }

  getEquipments(page: number = 1): Observable<ApiResponse<EquipmentListResponse>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<ApiResponse<EquipmentListResponse>>(`${this.API_URL}/equipments`, { params });
  }

  createEquipment(payload: FormData): Observable<ApiResponse<Equipment>> {
    return this.http.post<ApiResponse<Equipment>>(`${this.API_URL}/equipments`, payload);
  }

  updateEquipment(equipmentId: number, payload: FormData): Observable<ApiResponse<Equipment>> {
    return this.http.put<ApiResponse<Equipment>>(`${this.API_URL}/equipments/${equipmentId}`, payload);
  }

  getBookings(
    filters: { date?: string; search?: string; page?: number; size?: number } = {},
  ): Observable<ApiResponse<AdminBookingListResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') params = params.set(key, value.toString());
    });
    return this.http.get<ApiResponse<AdminBookingListResponse>>(`${this.API_URL}/bookings`, { params });
  }

  updateBookingStatus(bookingId: number, status: string): Observable<ApiResponse<AdminBookingDTO>> {
    return this.http.put<ApiResponse<AdminBookingDTO>>(`${this.API_URL}/bookings/${bookingId}/status`, { status });
  }

  getBookingDetail(bookingId: number): Observable<ApiResponse<AdminBookingDetailResponse>> {
    return this.http.get<ApiResponse<AdminBookingDetailResponse>>(`${this.API_URL}/bookings/${bookingId}`);
  }

  getRentals(page: number = 0, search: string = ''): Observable<ApiResponse<RentalToolListResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', '5');
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<RentalToolListResponse>>(`${this.API_URL}/rentals`, { params });
  }

  updateRentalStatus(rentalId: number, status: string): Observable<ApiResponse<RentalToolDTO>> {
    return this.http.put<ApiResponse<RentalToolDTO>>(`${this.API_URL}/rentals/${rentalId}/status`, { status });
  }

  getRentalDetail(rentalId: number): Observable<ApiResponse<AdminRentalDetailResponse>> {
    return this.http.get<ApiResponse<AdminRentalDetailResponse>>(`${this.API_URL}/rentals/${rentalId}`);
  }

  // ---- CANCEL_BOOKING_FEATURE — admin refund management ----

  /**
   * List bookings filtered by refund status (admin refund-requests page).
   * Pass {@code status='PENDING_REFUND'|'REFUNDED'} or omit for all DA_HUY.
   */
  getRefundRequests(
    status?: 'PENDING_REFUND' | 'REFUNDED' | null,
    page = 0,
    size = 10,
  ): Observable<ApiResponse<AdminBookingListResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<AdminBookingListResponse>>(`${this.API_URL}/bookings/refund-requests`, { params });
  }

  /** Mark a booking's deposit as refunded — fires REFUND_DONE notification BE-side. */
  confirmRefund(bookingId: number): Observable<ApiResponse<CancelBookingResponse>> {
    return this.http.put<ApiResponse<CancelBookingResponse>>(`${this.API_URL}/bookings/${bookingId}/refund`, {});
  }

  // ---- RentalTool refund management ----

  getRentalRefunds(
    refundStatus?: Extract<RentalRefundStatus, 'PENDING_REFUND' | 'REFUNDED'> | null,
    page = 0,
    size = 10,
  ): Observable<ApiResponse<RentalToolListResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (refundStatus) params = params.set('refundStatus', refundStatus);
    return this.http.get<ApiResponse<RentalToolListResponse>>(`${this.API_URL}/rentals/refunds`, { params });
  }

  confirmRentalRefund(rentalId: number): Observable<ApiResponse<RentalToolDTO>> {
    return this.http.post<ApiResponse<RentalToolDTO>>(`${this.API_URL}/rentals/${rentalId}/confirm-refund`, {});
  }
}
