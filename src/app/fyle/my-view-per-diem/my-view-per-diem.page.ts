import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { from, Observable } from 'rxjs';
import { finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { CustomField } from 'src/app/core/models/custom_field.model';
import { Expense } from 'src/app/core/models/expense.model';
import { CustomInputsService } from 'src/app/core/services/custom-inputs.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { OfflineService } from 'src/app/core/services/offline.service';
import { PerDiemService } from 'src/app/core/services/per-diem.service';
import { PolicyService } from 'src/app/core/services/policy.service';
import { TransactionService } from 'src/app/core/services/transaction.service';

@Component({
  selector: 'app-my-view-per-diem',
  templateUrl: './my-view-per-diem.page.html',
  styleUrls: ['./my-view-per-diem.page.scss'],
})
export class MyViewPerDiemPage implements OnInit {

  extendedPerDiem$: Observable<Expense>;
  orgSettings$: Observable<any>;
  perDiemCustomFields$: Observable<CustomField[]>;
  perDiemRate$: Observable<any>;
  isCriticalPolicyViolated$: Observable<boolean>;
  isAmountCapped$: Observable<boolean>;
  policyViloations$: Observable<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private transactionService: TransactionService,
    private loaderService: LoaderService,
    private offlineService: OfflineService,
    private customInputsService: CustomInputsService,
    private perDiemService: PerDiemService,
    private policyService: PolicyService
  ) { }

  isNumber(val) {
    return typeof val === 'number';
  }

  goBack() {
    // Todo: All logic of redirect to previous page
  }

  ionViewWillEnter() { 
    const id = this.activatedRoute.snapshot.params.id;

    this.extendedPerDiem$ = from(this.loaderService.showLoader()).pipe(
      switchMap(() => {
        return this.transactionService.getExpenseV2(id);
      }),
      finalize(() => from(this.loaderService.hideLoader())),
      shareReplay()
    );

    this.orgSettings$ = this.offlineService.getOrgSettings().pipe(
      shareReplay()
    );

    this.perDiemCustomFields$ = this.extendedPerDiem$.pipe(
      switchMap(res => {
        return this.customInputsService.fillCustomProperties(res.tx_org_category_id, res.tx_custom_properties, true);
      }),
      map(res => {
        return res.map(customProperties => { 
          customProperties.displayValue = this.customInputsService.getCustomPropertyDisplayValue(customProperties); 
          return customProperties; 
        })
      })
    );

    this.perDiemRate$ = this.extendedPerDiem$.pipe(
      switchMap(res=> {
        const per_diem_rate_id = parseInt(res.tx_per_diem_rate_id);
        return this.perDiemService.getRate(per_diem_rate_id);
      })
    );

    this.policyViloations$ = this.policyService.getPolicyRuleViolationsAndQueryParams(id);

    // this.policyViloations$.subscribe(res => {
    //   debugger;
    // })

    this.isCriticalPolicyViolated$ = this.extendedPerDiem$.pipe(
      map(res => {
        return this.isNumber(res.tx_policy_amount) && res.tx_policy_amount < 0.0001
      })
    )

    this.isAmountCapped$ = this.extendedPerDiem$.pipe(
      map(res => {
        return this.isNumber(res.tx_admin_amount) || this.isNumber(res.tx_policy_amount)
      })
    )

  }
  
  ngOnInit() {
  }

}