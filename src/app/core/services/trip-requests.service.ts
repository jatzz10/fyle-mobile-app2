import { Injectable } from '@angular/core';
import { ApiV2Service } from './api-v2.service';
import { AuthService } from './auth.service';
import { from } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { ExtendedTripRequest } from '../models/extended_trip_request.model';

@Injectable({
  providedIn: 'root'
})
export class TripRequestsService {

  constructor(
    private apiv2Service: ApiV2Service,
    private authService: AuthService
  ) { }

  getMyTrips(config: Partial<{ offset: number, limit: number, queryParams: any }> = {
    offset: 0,
    limit: 10,
    queryParams: {}
  }) {
    return from(this.authService.getEou()).pipe(
      switchMap(eou => {
        return this.apiv2Service.get('/trip_requests', {
          params: {
            offset: config.offset,
            limit: config.limit,
            trp_org_user_id: 'eq.' + eou.ou.id,
            ...config.queryParams
          }
        });
      }),
      map(res => res as {
        count: number,
        data: ExtendedTripRequest[],
        limit: number,
        offset: number,
        url: string
      }),
      map(res => ({
        ...res,
        data: res.data.map(this.fixDates)
      }))
    );
  }

  getTeamTrips(config: Partial<{ offset: number, limit: number, queryParams: any }> = {
    offset: 0,
    limit: 10,
    queryParams: {}
  }) {
    return from(this.authService.getEou()).pipe(
      switchMap(eou => {
        return this.apiv2Service.get('/trip_requests', {
          params: {
            offset: config.offset,
            limit: config.limit,
            approvers: 'cs.{' + eou.ou.id + '}',
            ...config.queryParams
          }
        });
      }),
      map(res => res as {
        count: number,
        data: ExtendedTripRequest[],
        limit: number,
        offset: number,
        url: string
      }),
      map(res => ({
        ...res,
        data: res.data.map(this.fixDates)
      }))
    );
  }

  fixDates(datum: ExtendedTripRequest) {
    datum.trp_created_at = new Date(datum.trp_created_at);
    datum.trp_updated_at = new Date(datum.trp_updated_at);

    datum.trp_trip_cities = datum.trp_trip_cities.map(trpCity => {
      trpCity.onward_date = new Date(trpCity.onward_date);
      trpCity.return_date = trpCity.return_date ? new Date(trpCity.return_date) : null;
      return trpCity;
    });

    datum.trp_start_date = new Date(datum.trp_start_date);
    datum.trp_end_date = new Date(datum.trp_end_date);

    return datum;
  }


  getMyTripsCount(queryParams = {}) {
    return this.getMyTrips({
      offset: 0,
      limit: 1,
      queryParams
    }).pipe(
      map(trip => trip.count)
    );
  }

  getInternalStateAndDisplayName(tripRequest: ExtendedTripRequest): { state: string, name: string } {
    if (tripRequest.trp_state === 'DRAFT') {
      if (!tripRequest.trp_is_pulled_back && !tripRequest.trp_is_sent_back) {
        return {
          state: 'draft',
          name: 'Draft'
        };
      } else if (tripRequest.trp_is_pulled_back) {
        return {
          state: 'pulledBack',
          name: 'Pulled Back'
        };
      } else if (tripRequest.trp_is_sent_back) {
        return {
          state: 'inquiry',
          name: 'Inquiry'
        };
      }
    } else if (tripRequest.trp_state === 'APPROVAL_PENDING') {
      return {
        state: 'pendingApproval',
        name: 'Pending Approval'
      };
    } else if (tripRequest.trp_state === 'APPROVED') {
      if (!tripRequest.trp_is_to_close) {
        if (tripRequest.trp_is_booked === null && tripRequest.trp_is_requested_cancellation === null) {
          return {
            state: 'approved',
            name: 'Approved'
          };
        } else if (tripRequest.trp_is_booked === false && tripRequest.trp_is_requested_cancellation === null) {
          return {
            state: 'pendingBooking',
            name: 'Pending Booking'
          };
        } else if (tripRequest.trp_is_booked === true && tripRequest.trp_is_requested_cancellation === null) {
          return {
            state: 'booked',
            name: 'Booked'
          };
        } else if (tripRequest.trp_is_booked === true && tripRequest.trp_is_requested_cancellation === true) {
          return {
            state: 'pendingCancellation',
            name: 'Pending Cancellation'
          };
        } else if (tripRequest.trp_is_requested_cancellation === false) {
          return {
            state: 'cancelled',
            name: 'Cancelled'
          };
        }
      } else {
        return {
          state: 'pendingClosure',
          name: 'Pending Closure'
        };
      }
    } else if (tripRequest.trp_state === 'CLOSED') {
      return {
        state: 'closed',
        name: 'Closed'
      };
    } else if (tripRequest.trp_state === 'REJECTED') {
      return {
        state: 'rejected',
        name: 'Rejected'
      };
    }
  }
}
