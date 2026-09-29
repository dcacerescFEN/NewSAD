export interface SiteConfig {
  menu: MenuDestinations;
  defaultSemester: string;
  defaultSemesterPostgraduate: string;
  pregraduateStudentTypes: string[];
  academicSituationsForModifyGrades: string[];
  specialGradeRecordAllowedAcademicSituations: string[];
  otherRequestTypesWithoutReason: string[];
  adminProcessingAllowedTypes: string[];
  fileAttachmentExcludedRequestType: string;
}

export interface MenuDestinations {
  alumnos: string;
  profesores: string;
  cursos: string;
  examenes: string;
  actividades: string;
  ayudantes: string;
  procesos: string;
  administracion: string;
}
