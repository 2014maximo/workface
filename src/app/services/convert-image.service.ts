import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConvertImageService {

  constructor(private http: HttpClient) { }

  fetchImage(imageUrl: string) {
    return this.http.get(imageUrl, { responseType: 'blob' }).pipe(
      switchMap((blob: Blob) => {
        return this.convertBlobToBase64(blob);
      })
    );
  }
  
  private convertBlobToBase64(blob: Blob): Observable<string> {
    return new Observable<string>((observer) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.readAsDataURL(blob);
    });
  }
}
