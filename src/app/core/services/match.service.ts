import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly API_URL = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  getMatchPosts(filters: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key].toString());
      }
    });
    return this.http.get<any>(`${this.API_URL}/match-posts`, { params });
  }

  getMatchPostDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/match-posts/${id}`);
  }

  createMatchPost(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/match-posts`, payload);
  }

  cancelMatchPost(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/match-posts/${id}/cancel`, {});
  }

  joinMatchPost(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/match-posts/${id}/join`, {});
  }

  leaveMatchPost(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/match-posts/${id}/leave`, {});
  }

  kickUser(postId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/match-posts/${postId}/kick/${userId}`, {});
  }

  getChatHistory(chatRoomId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/chat/history/${chatRoomId}`);
  }
}
