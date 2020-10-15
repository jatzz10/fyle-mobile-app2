import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { ExtendedAdvanceRequest } from 'src/app/core/models/extended_advance_request.model';
import { Approval } from 'src/app/core/models/approval.model';
import { CustomField } from 'src/app/core/models/custom_field.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/core/services/loader.service';
import { AdvanceRequestService } from 'src/app/core/services/advance-request.service';
import { AlertController, PopoverController } from '@ionic/angular';
import { from, noop } from 'rxjs';
import { switchMap, finalize, shareReplay, concatMap, map, reduce } from 'rxjs/operators';

@Component({
  selector: 'app-view-team-advance',
  templateUrl: './view-team-advance.page.html',
  styleUrls: ['./view-team-advance.page.scss'],
})
export class ViewTeamAdvancePage implements OnInit {

  advanceRequest$: Observable<ExtendedAdvanceRequest>;
  actions$: Observable<any>;
  activeApprovals$: Observable<Approval[]>;
  attachedFiles$: Observable<File[]>;
  advanceRequestCustomFields$: Observable<CustomField[]>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private advanceRequestService: AdvanceRequestService,
    private fileService: FileService,
    private alertController: AlertController,
    private router: Router,
    private popoverController: PopoverController
  ) { }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params.id;
    this.advanceRequest$ = from(this.loaderService.showLoader()).pipe(
      switchMap(() => {
        return this.advanceRequestService.getAdvanceRequest(id);
      }),
      finalize(() => from(this.loaderService.hideLoader())),
      shareReplay()
    );

    this.actions$ = this.advanceRequestService.getActions(id).pipe(
      shareReplay()
    );
    this.activeApprovals$ = this.advanceRequestService.getActiveApproversByAdvanceRequestId(id);
    this.attachedFiles$ = this.fileService.findByAdvanceRequestId(id).pipe(
      switchMap(res => {
        return from(res);
      }),
      concatMap(file => {
        return this.fileService.downloadUrl(file.id).pipe(
          map(url => {
            file.file_download_url = url;
            return file as File;
          })
        )
      }),
      reduce((acc, curr) => {
        return acc.concat(curr);
      }, [] as File[])
    );

    this.advanceRequestCustomFields$ = this.advanceRequest$.pipe(
      map(res => {
         return this.advanceRequestService.modifyAdvanceRequestCustomFields(JSON.parse(res.areq_custom_field_values));
      })
    );
  }

  // async pullBack() {
  //   const pullBackPopover = await this.popoverController.create({
  //     component: PullBackAdvanceRequestComponent,
  //     cssClass: 'dialog-popover'
  //   });

  //   await pullBackPopover.present();

  //   const { data } = await pullBackPopover.onWillDismiss();

  //   if (data) {
  //     const status = {
  //       comment: data.comment
  //     };

  //     const addStatusPayload = {
  //       status,
  //       notify: false
  //     };

  //     const id = this.activatedRoute.snapshot.params.id;

  //     from(this.loaderService.showLoader()).pipe(
  //       switchMap(() => {
  //         return this.advanceRequestService.pullBackadvanceRequest(id, addStatusPayload);
  //       }),
  //       finalize(() => from(this.loaderService.hideLoader()))
  //     ).subscribe(() => {
  //       this.router.navigate(['/', 'enterprise', 'my_advances']);
  //     });
  //   }
  // }

  // Todo: Redirect to edit advance page
  edit() {
  }

  // async delete() {
  //   const id = this.activatedRoute.snapshot.params.id;

  //   const alert = await this.alertController.create({
  //     header: 'Confirm!',
  //     message: 'Are you sure you want to delete this Advance Request',
  //     buttons: [
  //       {
  //         text: 'Cancel',
  //         role: 'cancel',
  //         handler: noop
  //       }, {
  //         text: 'Okay',
  //         handler: () => {
  //           this.advanceRequestService.delete(id).subscribe(() => {
  //             this.router.navigate(['/', 'enterprise', 'my_advances']);
  //           });
  //         }
  //       }
  //     ]
  //   });

  //   await alert.present();
  // }

  ngOnInit() {
  }

}
