import { Component, OnInit } from '@angular/core';
import { FORMATOS } from '../../../constants/curriculums.constant';
import { CurriculumModel } from '../../../models/formatos.model';

@Component({
  selector: 'app-curriculums',
  templateUrl: 'curriculums.component.html',
  styleUrls: ['curriculums.component.css']
})
export class CurriculumsComponent implements OnInit {

  public formatos:CurriculumModel[] = FORMATOS;

  constructor() { 
    debugger;
    console.log(this.formatos, 'FORMATOS')
  }

  ngOnInit(): void {
  }

}
