import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';
import CmPmReport, { CmPmReportTemplate } from 'src/models/owns/cmPmReport';
import api from 'src/utils/api';
import { revertAll } from 'src/utils/redux';

const basePath = 'cm-pm-reports';

interface CmPmReportState {
  reports: CmPmReport[];
  singleReport: CmPmReport;
  templates: CmPmReportTemplate[];
  loading: boolean;
}

const initialState: CmPmReportState = {
  reports: [],
  singleReport: null,
  templates: [],
  loading: false
};

const slice = createSlice({
  name: 'cmPmReports',
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    setLoading(state, action: PayloadAction<{ loading: boolean }>) {
      state.loading = action.payload.loading;
    },
    getReports(state, action: PayloadAction<{ reports: CmPmReport[] }>) {
      state.reports = action.payload.reports;
    },
    getSingleReport(state, action: PayloadAction<{ report: CmPmReport }>) {
      state.singleReport = action.payload.report;
    },
    getTemplates(
      state,
      action: PayloadAction<{ templates: CmPmReportTemplate[] }>
    ) {
      state.templates = action.payload.templates;
    },
    upsertReport(state, action: PayloadAction<{ report: CmPmReport }>) {
      const report = action.payload.report;
      const index = state.reports.findIndex((r) => r.id === report.id);
      if (index === -1) state.reports.unshift(report);
      else state.reports[index] = report;
      state.singleReport = report;
    },
    removeReport(state, action: PayloadAction<{ id: number }>) {
      state.reports = state.reports.filter((report) => report.id !== action.payload.id);
      if (state.singleReport?.id === action.payload.id) state.singleReport = null;
    }
  }
});

export const reducer = slice.reducer;

export const getCmPmReports =
  (filters = {}): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.setLoading({ loading: true }));
    try {
      const reports = await api.post<CmPmReport[]>(`${basePath}/search`, filters);
      dispatch(slice.actions.getReports({ reports }));
    } finally {
      dispatch(slice.actions.setLoading({ loading: false }));
    }
  };

export const getCmPmReport =
  (id: number): AppThunk =>
  async (dispatch) => {
    const report = await api.get<CmPmReport>(`${basePath}/${id}`);
    dispatch(slice.actions.getSingleReport({ report }));
  };

export const getCmPmReportTemplates = (): AppThunk => async (dispatch) => {
  const templates = await api.get<CmPmReportTemplate[]>(`${basePath}/templates`);
  dispatch(slice.actions.getTemplates({ templates }));
};

export const addCmPmReport =
  (report: Partial<CmPmReport>, templateKey?: string): AppThunk =>
  async (dispatch) => {
    const created = templateKey
      ? await api.post<CmPmReport>(`${basePath}/templates/${templateKey}`, report)
      : await api.post<CmPmReport>(basePath, report);
    dispatch(slice.actions.upsertReport({ report: created }));
    return created as any;
  };

export const editCmPmReport =
  (id: number, report: Partial<CmPmReport>): AppThunk =>
  async (dispatch) => {
    const updated = await api.patch<CmPmReport>(`${basePath}/${id}`, report);
    dispatch(slice.actions.upsertReport({ report: updated }));
    return updated as any;
  };

export const duplicateCmPmReport =
  (id: number): AppThunk =>
  async (dispatch) => {
    const duplicated = await api.post<CmPmReport>(`${basePath}/${id}/duplicate`, {});
    dispatch(slice.actions.upsertReport({ report: duplicated }));
    return duplicated as any;
  };

export const deleteCmPmReport =
  (id: number): AppThunk =>
  async (dispatch) => {
    const response = await api.deletes<{ success: boolean }>(`${basePath}/${id}`);
    if (response.success) dispatch(slice.actions.removeReport({ id }));
  };

export const exportCmPmReportPdf =
  (id: number): AppThunk =>
  async (): Promise<string> => {
    const response = await api.get<{ success: boolean; message: string }>(
      `${basePath}/${id}/report`
    );
    return response.message;
  };

export default slice;
