import { Audit } from './audit';

export type CmPmReportType = 'CM' | 'PM';
export type CmPmReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ARCHIVED';
export type CmPmSegmentType = 'text' | 'table' | 'checklist' | 'signature';

export interface CmPmReportSegment {
  id: string;
  type: CmPmSegmentType;
  title: string;
  collapsed?: boolean;
  config?: any;
  content?: any;
}

export default interface CmPmReport extends Audit {
  reportRef: string;
  reportType: CmPmReportType;
  title?: string;
  projectName: string;
  clientName?: string;
  contractorName?: string;
  facilityLocation?: string;
  systemLocation?: string;
  equipmentId?: string;
  reportDate: string | Date;
  preparedBy?: string;
  status: CmPmReportStatus;
  metadata?: any;
  segments: CmPmReportSegment[];
}

export interface CmPmReportTemplate {
  key: string;
  name: string;
  reportType: CmPmReportType;
}
