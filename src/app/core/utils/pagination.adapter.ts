export class PaginationAdapter {
  /**
   * Chuyển đổi số trang từ UI (1-based) sang dạng API mong muốn.
   * @param uiPage Trang hiện tại trên giao diện (thường bắt đầu từ 1)
   * @param apiBase '0-based' hoặc '1-based' tùy theo backend constraint
   */
  static toApiPage(uiPage: number, apiBase: '0-based' | '1-based'): number {
    if (apiBase === '0-based') {
      return uiPage - 1 >= 0 ? uiPage - 1 : 0;
    }
    return uiPage;
  }

  /**
   * Chuyển đổi số trang từ API trả về sang dạng hiển thị UI.
   */
  static toUiPage(apiPage: number, apiBase: '0-based' | '1-based'): number {
    if (apiBase === '0-based') {
      return apiPage + 1;
    }
    return apiPage;
  }
}
