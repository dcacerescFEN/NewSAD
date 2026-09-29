import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);


  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      let errorMessage = 'An unexpected error occurred';

      switch (error.status) {
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'You are not authorized. Please log in.';
          if (router.url !== '/forbidden') {
            void router.navigateByUrl('/forbidden');
          }
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }

      return throwError(() => error);
    })
  );
};
