export class FormDataHelper {
  /**
   * Tạo FormData chuẩn cho Multipart Requests chứa cả JSON và File
   * @param jsonKey Tên trường JSON (ví dụ: 'user', 'product', 'racket')
   * @param jsonData Đối tượng dữ liệu JSON
   * @param fileKey Tên trường File (ví dụ: 'avatarFile', 'productImg', 'racketImg')
   * @param file File cần upload
   */
  static createMultipartData(
    jsonKey: string,
    jsonData: any,
    fileKey?: string,
    file?: File
  ): FormData {
    const formData = new FormData();
    
    formData.append(
      jsonKey,
      new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
    );

    if (fileKey && file) {
      formData.append(fileKey, file);
    }

    return formData;
  }
}
