import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ViewTeamReportPageRoutingModule } from './view-team-report-routing.module';
import { ViewTeamReportPage } from './view-team-report.page';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ViewTeamReportEtxnCardComponent } from './view-team-report-etxn-card/view-team-report-etxn-card.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViewTeamReportPageRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    SharedModule
  ],
  declarations: [
    ViewTeamReportPage,
    ViewTeamReportEtxnCardComponent
  ]
})
export class ViewTeamReportPageModule {}